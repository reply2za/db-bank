import { BankUser } from './BankUser';
import { IOUTicket } from './IOUTicket';
import { UserManager } from 'discord.js';
import { roundNumberTwoDecimals } from '../utils/utils';
import leven from 'leven';
import { localStorage } from '../Storage/LocalStorage';

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

    transferIOU(
        sender: BankUser,
        receiver: BankUser,
        amount: number,
        comment: string
    ): { success: boolean; failReason: string } {
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

    transferAmount(sender: BankUser, receiver: BankUser, amount: number): { success: boolean; failReason: string } {
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

    getUser(id: string) {
        return this.users.get(id);
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }

    getUserIOUs(id: string): IOUTicket[] {
        return this.iOUList.filter((value: IOUTicket) => value.receiver.id === id);
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
