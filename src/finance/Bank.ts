import { BankUser } from './BankUser';
import { IOUTicket } from './IOUTicket';
import { TextBasedChannel, UserManager } from 'discord.js';
import { roundNumberTwoDecimals } from '../utils/numberUtils';
import leven from 'leven';
import { localStorage } from '../storage/LocalStorage';
import Logger from '../utils/Logger';
import { FinalTransferStatus, TransferType } from './types';
import chargeTransferVisualizer from './visualizers/transfers/chargeTransferVisualizer';
import cashTransferVisualizer from './visualizers/transfers/cashTransferVisualizer';
import visualizerCommon from './visualizers/visualizerCommon';

class Bank {
    users: Map<string, BankUser> = new Map();
    iOUList: Array<IOUTicket> = [];
    #usernames: Set<string> = new Set();

    constructor() {}

    #resetAllData() {
        this.users = new Map();
        this.iOUList = [];
        this.#usernames = new Set();
    }

    transferIOU(sender: BankUser, receiver: BankUser, amount: number, comment: string): FinalTransferStatus {
        if (amount > 99) {
            return {
                success: false,
                failReason: 'cannot send more than 99 IOUs',
            };
        }
        const date = new Date();
        for (let i = 0; i < amount; i++) {
            const iou = new IOUTicket(
                null,
                { id: sender.userId, name: sender.name },
                { id: receiver.userId, name: receiver.name },
                `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substring(2)}`,
                comment
            );
            this.iOUList.push(iou);
        }
        return {
            success: true,
            failReason: '',
        };
    }

    async #recordTransfer(
        transferResponse: FinalTransferStatus,
        transferAmount: number,
        sender: BankUser,
        receiver: BankUser,
        channel: TextBasedChannel,
        transferType: TransferType,
        comment = ''
    ) {
        if (transferResponse.success) {
            await localStorage.saveData(bank.serializeData());
            if (transferType === TransferType.CHARGE) {
                await sender.getDiscordUser().send({
                    embeds: [
                        chargeTransferVisualizer
                            .getChargeNotificationEmbed(sender, receiver.name, transferAmount, comment)
                            .build(),
                    ],
                });
                await chargeTransferVisualizer.getChargeReceiptEmbed(sender.name, transferAmount).send(channel);
            } else {
                await receiver.getDiscordUser().send({
                    embeds: [
                        cashTransferVisualizer
                            .getTransferNotificationEmbed(sender.name, receiver, transferAmount, comment)
                            .build(),
                    ],
                });
                await cashTransferVisualizer.getTransferReceiptEmbed(receiver.name, transferAmount).send(channel);
            }
            await Logger.transactionLog(
                `[${transferType}] $${transferAmount} from ${sender.name} to ${receiver.name}\n` +
                    `new balances:\n` +
                    `${sender.name}: ${sender.balance}\n` +
                    `${receiver.name}: ${receiver.balance}\n`
            );
        } else {
            await visualizerCommon
                .getErrorEmbed(`${transferType} failed: ${transferResponse.failReason || 'unknown reason'}`)
                .send(channel);
        }
    }

    #transferAmountCore(sender: BankUser, receiver: BankUser, amount: number): FinalTransferStatus {
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

    async transferAmount(
        sender: BankUser,
        receiver: BankUser,
        amount: number,
        channel: TextBasedChannel,
        type = TransferType.TRANSFER,
        comment = ''
    ): Promise<FinalTransferStatus> {
        const transferResponse = this.#transferAmountCore(sender, receiver, amount);
        await this.#recordTransfer(transferResponse, amount, sender, receiver, channel, type, comment);
        return transferResponse;
    }

    getUser(id: string) {
        return this.users.get(id);
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    /**
     * Gets all the active IOU tickets given to a user.
     * @param id The user id
     */
    getUserIOUs(id: string): IOUTicket[] {
        return this.iOUList.filter((value: IOUTicket) => value.receiver.id === id);
    }

    /**
     * Gets all the active sent IOU tickets by a user.
     * @param id The user id
     */
    getUserSentIOUs(id: string) {
        return this.iOUList.filter((value: IOUTicket) => value.sender.id === id);
    }

    getAllIOUs() {
        return this.iOUList;
    }

    addNewUser(bankUser: BankUser) {
        if (this.#usernames.has(bankUser.name)) {
            throw new Error('name already exists');
        }
        this.#usernames.add(bankUser.name);
        this.users.set(bankUser.userId, bankUser);
        return bankUser;
    }

    serializeData() {
        const userData = this.getAllUsers();
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
                this.users.set(userObj.userId, new BankUser(user, userObj.name, userObj.balance));
            } catch (e) {
                console.log('could not load user data\n', e);
            }
        }
        for (let iou of parsedData.bank.ious) {
            this.iOUList.push(new IOUTicket(iou.id, iou.sender, iou.receiver, iou.date, iou.comment));
        }
    }

    findUser(name: string): Array<BankUser> {
        const matches = [];
        for (const [, value] of this.users) {
            if (leven(value.name.toLowerCase(), name.toLowerCase()) < 2) {
                matches.push(value);
            }
        }
        matches.sort((a: BankUser, b: BankUser) => a.name.length - b.name.length);
        return matches;
    }

    async redeemIOU(id: string): Promise<boolean> {
        const prevLength = this.iOUList.length;
        this.iOUList = this.iOUList.filter((value) => {
            return value.id !== id;
        });
        const newLength = this.iOUList.length;
        await localStorage.saveData(bank.serializeData());
        return prevLength !== newLength;
    }
}

const bank = new Bank();
export { bank };
