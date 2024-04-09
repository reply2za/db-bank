import { OriginalBankUser } from './BankUser/OriginalBankUser';
import { IOUTicket } from './IOUTicket';
import { TextBasedChannel, User, UserManager } from 'discord.js';
import { convertToCurrency, roundNumberTwoDecimals } from '../utils/numberUtils';
import leven from 'leven';
import { localStorage } from '../storage/LocalStorage';
import logger from '../utils/Logger';
import { StatusWithErrorResponse, TransferType } from './types';
import visualizerCommon from './visualizers/visualizerCommon';
import { BankUserCopy } from './BankUser/BankUserCopy';
import { config } from '../utils/constants/constants';
import { ABankUser } from './BankUser/ABankUser';
import { formatDate, unitFormatFactory } from '../utils/utils';
import { Balance } from '../utils/wrappers/Balance';

export class Bank {
    #users: Map<string, OriginalBankUser> = new Map();
    #iOUList: Array<IOUTicket> = [];
    #usernames: Set<string> = new Set();

    constructor() {}

    async transferIOU(
        senderId: string,
        receiverId: string,
        quantity: number,
        comment: string,
        channel: TextBasedChannel
    ): Promise<StatusWithErrorResponse> {
        const senderAndReceiverObj = this.#getSenderAndReceiver(senderId, receiverId);
        const senderAndReceiverStatus = this.#verifySenderAndReceiver(senderAndReceiverObj);
        if (!senderAndReceiverStatus.success) {
            return senderAndReceiverStatus;
        }
        const sender = <OriginalBankUser>senderAndReceiverObj.sender;
        const receiver = <OriginalBankUser>senderAndReceiverObj.receiver;
        if (quantity > config.maxIOUCountPerReq) {
            return {
                success: false,
                failReason: `cannot send more than ${config.maxIOUCountPerReq} IOUs`,
            };
        }
        if (quantity < 1) {
            return {
                success: false,
                failReason: 'cannot send less than 1 IOUs',
            };
        }
        const date = new Date();
        const expirationDate = IOUTicket.setExpirationDate(new Date());
        const iou = new IOUTicket(
            null,
            { id: sender.getUserId(), name: sender.getUsername() },
            { id: receiver.getUserId(), name: receiver.getUsername() },
            formatDate(date),
            formatDate(expirationDate),
            comment,
            quantity
        );
        this.#iOUList.push(iou);
        const transferResponse = {
            success: true,
            failReason: '',
        };
        await this.#recordTransfer(
            transferResponse,
            quantity,
            sender.getUserId(),
            receiver.getUserId(),
            channel,
            TransferType.TRANSFER_IOU,
            comment
        );
        return transferResponse;
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

    async chargeAmount(
        senderId: string,
        receiverId: string,
        amount: number,
        channel: TextBasedChannel,
        comment = ''
    ): Promise<StatusWithErrorResponse> {
        const senderAndReceiverObj = this.#getSenderAndReceiver(senderId, receiverId);
        const senderAndReceiverStatus = this.#verifySenderAndReceiver(senderAndReceiverObj);
        if (!senderAndReceiverStatus.success) {
            return senderAndReceiverStatus;
        }
        const sender = <OriginalBankUser>senderAndReceiverObj.sender;
        const transferResponse = this.#chargeAmountCore(sender, amount);
        await this.#recordTransfer(
            transferResponse,
            amount,
            senderId,
            receiverId,
            channel,
            TransferType.CHARGE,
            comment
        );
        return transferResponse;
    }

    async creditAmount(
        receiverId: string,
        amount: number,
        channel: TextBasedChannel,
        comment = ''
    ): Promise<StatusWithErrorResponse> {
        const receiver = this.#users.get(receiverId);
        if (!receiver) {
            return {
                success: false,
                failReason: 'could not find receiver',
            };
        }
        const transferResponse = this.#creditAmountCore(receiver, amount);
        await this.#recordTransfer(
            transferResponse,
            amount,
            config.BOT_ID,
            receiverId,
            channel,
            TransferType.CREDIT,
            comment
        );
        return transferResponse;
    }

    getUserCopy(id: string): BankUserCopy | undefined {
        return this.#users.get(id)?.getBankUserCopy();
    }

    getAllUsers(): BankUserCopy[] {
        return Array.from(this.#users.values()).map((bankUser) => bankUser.getBankUserCopy());
    }

    /**
     * Gets all the active IOU tickets given to a author.
     * @param id The author id
     */
    getUserIOUs(id: string): IOUTicket[] {
        let iouArr = this.#iOUList.filter((value: IOUTicket) => value.receiver.id === id);
        let now = Date.now();
        return iouArr.filter((iou) => {
            let expDate = Date.parse(iou.expirationDate);
            if (Number.isNaN(expDate)) return true;
            return expDate >= now;
        });
    }

    /**
     * Gets all the active sent IOU tickets by a author.
     * @param id The author id
     */
    getUserSentIOUs(id: string) {
        return this.#iOUList.filter((value: IOUTicket) => value.sender.id === id);
    }

    getAllIOUs(): IOUTicket[] {
        return this.#iOUList;
    }

    addNewUser(author: User, username: string, balance: number, history?: string[]): BankUserCopy {
        const bankUser = new OriginalBankUser(author, username, new Balance(balance), history);
        if (this.#usernames.has(bankUser.getUsername())) {
            throw new Error('name already exists');
        }
        this.#usernames.add(bankUser.getUsername());
        this.#users.set(bankUser.getUserId(), bankUser);
        return bankUser.getBankUserCopy();
    }

    serializeData() {
        const userData = this.getAllUsers().map((bankUser) => bankUser.getSerializableData());
        const iouData = this.getAllIOUs().map((iou) => iou.getSerializableData());
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
                this.#users.set(
                    userObj.userId,
                    new OriginalBankUser(user, userObj.name, new Balance(userObj.balance), userObj.history)
                );
            } catch (e) {
                console.log('could not load author data\n', e);
            }
        }
        for (let iou of parsedData.bank.ious) {
            this.#iOUList.push(
                new IOUTicket(iou.id, iou.sender, iou.receiver, iou.date, iou.expirationDate, iou.comment, iou.quantity)
            );
        }
    }

    findUser(name: string): Array<BankUserCopy> {
        const matches = [];
        const addDiscriminator = (user: ABankUser) =>
            name.includes('#') ? `#${user.getDiscordUser().discriminator}` : '';
        for (const [, value] of this.#users) {
            value.getDiscordUser().fetch().catch();
            if (leven(`${value.getUsername().toLowerCase()}${addDiscriminator(value)}`, name.toLowerCase()) < 2) {
                matches.push(value);
            }
        }
        matches.sort((a: OriginalBankUser, b: OriginalBankUser) => a.getUsername().length - b.getUsername().length);
        return matches;
    }

    async redeemIOU(id: string, quantity: number): Promise<boolean> {
        const iouToRedeemIndex = this.#iOUList.findIndex((value) => value.id == id);
        if (iouToRedeemIndex === undefined) {
            return false;
        }
        const iouToRedeem = this.#iOUList[iouToRedeemIndex];
        const newQuantity = iouToRedeem.quantity - quantity;
        if (newQuantity < 0) {
            return false;
        }
        if (newQuantity > 0) {
            this.#iOUList[iouToRedeemIndex] = iouToRedeem.cloneWithNewQuantity(newQuantity);
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
        let unitFormatter = unitFormatFactory(transferType);
        const sender = <OriginalBankUser>senderAndReceiverObj.sender;
        const receiver = <OriginalBankUser>senderAndReceiverObj.receiver;
        if (transferResponse.success) {
            await localStorage.saveData(bank.serializeData());
            const logItem = `[${transferType}] (${sender.getUserId()} -> ${receiver.getUserId()})\n`
                .concat(`${unitFormatter(transferAmount)} from ${sender.getDBName()} to ${receiver.getDBName()} \n`)
                .concat(`comment: ${comment}\n`)
                .concat(`${this.#printUserBalances(sender, receiver)}\n`)
                .concat(`----------------------------------------\n`);
            await logger.transactionLog(logItem);
        } else {
            await visualizerCommon
                .getErrorEmbed(`${transferType} failed: ${transferResponse.failReason || 'unknown reason'}`)
                .send(channel);
        }
    }

    #printUserBalances(sender: OriginalBankUser, receiver: OriginalBankUser): string {
        return (
            `${sender.getDBName()}: ${convertToCurrency(sender.getBalance())}\n` +
            `${receiver.getDBName()}: ${convertToCurrency(receiver.getBalance())}`
        );
    }

    #chargeAmountCore(bankUser: OriginalBankUser, amount: number): StatusWithErrorResponse {
        if (!amount) return { success: false, failReason: 'input error' };
        amount = roundNumberTwoDecimals(amount);
        if (amount < 0) {
            return { success: false, failReason: 'cannot deduct a negative balance' };
        }
        bankUser.subtractBalance(amount);
        return { success: true, failReason: '' };
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

    /**
     * Verify that the sender and receiver exist
     * @param senderReceiverPayload
     * @private
     */
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

    #creditAmountCore(receiver: OriginalBankUser, amount: number) {
        if (!amount) return { success: false, failReason: 'input error' };
        amount = roundNumberTwoDecimals(amount);
        if (amount < 0) {
            return { success: false, failReason: 'cannot credit negative balance' };
        }
        receiver.addBalance(amount);
        return { success: true, failReason: '' };
    }
}

export const bank = new Bank();
