import { OriginalBankUser } from './BankUser/OriginalBankUser';
import { IOUTicket } from './IOUTicket';
import { TextBasedChannel, User, UserManager } from 'discord.js';
import { roundNumberTwoDecimals } from '../utils/numberUtils';
import leven from 'leven';
import { localStorage } from '../storage/LocalStorage';
import Logger from '../utils/Logger';
import { StatusWithErrorResponse, TransferType } from './types';
import chargeTransferVisualizer from './visualizers/transfers/chargeTransferVisualizer';
import cashTransferVisualizer from './visualizers/transfers/cashTransferVisualizer';
import visualizerCommon from './visualizers/visualizerCommon';
import { BankUserCopy } from './BankUser/BankUserCopy';

class Bank {
    #users: Map<string, OriginalBankUser> = new Map();
    #iOUList: Array<IOUTicket> = [];
    #usernames: Set<string> = new Set();

    constructor() {}

    transferIOU(senderId: string, receiverId: string, quantity: number, comment: string): StatusWithErrorResponse {
        const senderAndReceiverObj = this.#getSenderAndReceiver(senderId, receiverId);
        const senderAndReceiverStatus = this.#verifySenderAndReceiver(senderAndReceiverObj);
        if (!senderAndReceiverStatus.success) {
            return senderAndReceiverStatus;
        }
        const sender = <OriginalBankUser>senderAndReceiverObj.sender;
        const receiver = <OriginalBankUser>senderAndReceiverObj.receiver;
        if (quantity > 99) {
            return {
                success: false,
                failReason: 'cannot send more than 99 IOUs',
            };
        }
        if (quantity < 1) {
            return {
                success: false,
                failReason: 'cannot send less than 1 IOUs',
            };
        }
        const date = new Date();
        const iou = new IOUTicket(
            null,
            { id: sender.getUserId(), name: sender.getName() },
            { id: receiver.getUserId(), name: receiver.getName() },
            `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substring(2)}`,
            comment,
            quantity
        );
        this.#iOUList.push(iou);
        return {
            success: true,
            failReason: '',
        };
    }

    async transferAmount(
        senderId: string,
        receiverId: string,
        amount: number,
        channel: TextBasedChannel,
        type = TransferType.TRANSFER,
        comment = ''
    ): Promise<StatusWithErrorResponse> {
        const senderAndReceiverObj = this.#getSenderAndReceiver(senderId, receiverId);
        const senderAndReceiverStatus = this.#verifySenderAndReceiver(senderAndReceiverObj);
        if (!senderAndReceiverStatus.success) {
            return senderAndReceiverStatus;
        }
        const sender = <OriginalBankUser>senderAndReceiverObj.sender;
        const receiver = <OriginalBankUser>senderAndReceiverObj.receiver;
        const transferResponse = this.#transferAmountCore(sender, receiver, amount);
        await this.#recordTransfer(transferResponse, amount, senderId, receiverId, channel, type, comment);
        return transferResponse;
    }

    getUserCopy(id: string): BankUserCopy | undefined {
        return this.#users.get(id)?.getBankUserCopy();
    }

    getAllUsers(): BankUserCopy[] {
        return Array.from(this.#users.values()).map((bankUser) => bankUser.getBankUserCopy());
    }

    /**
     * Gets all the active IOU tickets given to a user.
     * @param id The user id
     */
    getUserIOUs(id: string): IOUTicket[] {
        return this.#iOUList.filter((value: IOUTicket) => value.receiver.id === id);
    }

    /**
     * Gets all the active sent IOU tickets by a user.
     * @param id The user id
     */
    getUserSentIOUs(id: string) {
        return this.#iOUList.filter((value: IOUTicket) => value.sender.id === id);
    }

    getAllIOUs() {
        return this.#iOUList;
    }

    addNewUser(author: User, username: string, balance: number): BankUserCopy {
        const bankUser = new OriginalBankUser(author, username, balance);
        if (this.#usernames.has(bankUser.getName())) {
            throw new Error('name already exists');
        }
        this.#usernames.add(bankUser.getName());
        this.#users.set(bankUser.getUserId(), bankUser);
        return bankUser.getBankUserCopy();
    }

    serializeData() {
        const userData = this.getAllUsers().map((bankUser) => bankUser.getSerializableData());
        const iouData = this.getAllIOUs();
        const serializedData = {
            bank: {
                users: userData,
                ious: iouData,
            },
        };
        return JSON.stringify(serializedData, null, 2);
    }

    async deserializeAndLoadData(data: string, userManager: UserManager) {
        this.#resetAllData();
        const parsedData = JSON.parse(data);
        for (let userObj of parsedData.bank.users) {
            try {
                const user = await userManager.fetch(userObj.userId);
                this.#users.set(userObj.userId, new OriginalBankUser(user, userObj.name, userObj.balance));
            } catch (e) {
                console.log('could not load user data\n', e);
            }
        }
        for (let iou of parsedData.bank.ious) {
            this.#iOUList.push(new IOUTicket(iou.id, iou.sender, iou.receiver, iou.date, iou.comment, iou.quantity));
        }
    }

    findUser(name: string): Array<BankUserCopy> {
        const matches = [];
        for (const [, value] of this.#users) {
            if (leven(value.getName().toLowerCase(), name.toLowerCase()) < 2) {
                matches.push(value);
            }
        }
        matches.sort((a: OriginalBankUser, b: OriginalBankUser) => a.getName().length - b.getName().length);
        return matches;
    }

    async redeemIOU(id: string): Promise<boolean> {
        const iouToRedeemIndex = this.#iOUList.findIndex((value) => value.id == id);
        if (!iouToRedeemIndex) {
            return false;
        }
        const iouToRedeem = this.#iOUList[iouToRedeemIndex];
        if (iouToRedeem.quantity > 1) {
            this.#iOUList[iouToRedeemIndex] = iouToRedeem.cloneWithNewQuantity(iouToRedeem.quantity - 1);
        } else {
            this.#iOUList.splice(iouToRedeemIndex, 1);
        }
        await localStorage.saveData(bank.serializeData());
        return true;
    }

    #resetAllData() {
        this.#users = new Map();
        this.#iOUList = [];
        this.#usernames = new Set();
    }

    async #recordTransfer(
        transferResponse: StatusWithErrorResponse,
        transferAmount: number,
        senderId: string,
        receiverId: string,
        channel: TextBasedChannel,
        transferType: TransferType,
        comment = ''
    ) {
        const senderAndReceiverObj = this.#getSenderAndReceiver(senderId, receiverId);
        const senderAndReceiverStatus = this.#verifySenderAndReceiver(senderAndReceiverObj);
        if (!senderAndReceiverStatus.success) {
            return senderAndReceiverStatus;
        }
        const sender = <OriginalBankUser>senderAndReceiverObj.sender;
        const receiver = <OriginalBankUser>senderAndReceiverObj.receiver;
        if (transferResponse.success) {
            await localStorage.saveData(bank.serializeData());
            if (transferType === TransferType.CHARGE) {
                await sender.getDiscordUser().send({
                    embeds: [
                        chargeTransferVisualizer
                            .getChargeNotificationEmbed(sender, receiver.getName(), transferAmount, comment)
                            .build(),
                    ],
                });
                await chargeTransferVisualizer.getChargeReceiptEmbed(sender.getName(), transferAmount).send(channel);
            } else {
                await receiver.getDiscordUser().send({
                    embeds: [
                        cashTransferVisualizer
                            .getTransferNotificationEmbed(sender.getName(), receiver, transferAmount, comment)
                            .build(),
                    ],
                });
                await cashTransferVisualizer.getTransferReceiptEmbed(receiver.getName(), transferAmount).send(channel);
            }
            await Logger.transactionLog(
                `[${transferType}] $${transferAmount} from ${sender.getName()} to ${receiver.getName()}\n` +
                    `new balances:\n` +
                    `${sender.getName()}: ${sender.getBalance()}\n` +
                    `${receiver.getName()}: ${receiver.getBalance()}\n` +
                    `comment: ${comment}`
            );
        } else {
            await visualizerCommon
                .getErrorEmbed(`${transferType} failed: ${transferResponse.failReason || 'unknown reason'}`)
                .send(channel);
        }
    }

    #transferAmountCore(sender: OriginalBankUser, receiver: OriginalBankUser, amount: number): StatusWithErrorResponse {
        if (!amount) return { success: false, failReason: 'input error' };
        amount = roundNumberTwoDecimals(amount);
        if (sender.getBalance() < amount) {
            return { success: false, failReason: 'balance is too low' };
        }
        if (amount < 0) {
            return { success: false, failReason: 'cannot transfer negative balance' };
        }
        sender.subtractBalance(amount);
        receiver.addBalance(amount);

        return { success: true, failReason: '' };
    }

    #getSenderAndReceiver(
        senderId: string,
        receiverId: string
    ): { sender: OriginalBankUser | undefined; receiver: OriginalBankUser | undefined } {
        const sender = this.#getOrigBankUser(senderId);
        const receiver = this.#getOrigBankUser(receiverId);
        return { sender, receiver };
    }

    #getOrigBankUser(id: string): OriginalBankUser | undefined {
        return this.#users.get(id);
    }

    #verifySenderAndReceiver(senderReceiverPayload: {
        sender: OriginalBankUser | undefined;
        receiver: OriginalBankUser | undefined;
    }): StatusWithErrorResponse {
        if (!senderReceiverPayload.sender) {
            return {
                success: false,
                failReason: 'cannot find sender',
            };
        }
        if (!senderReceiverPayload.receiver) {
            return {
                success: false,
                failReason: 'cannot find receiver',
            };
        }
        return {
            success: true,
            failReason: '',
        };
    }
}

const bank = new Bank();
export { bank };
