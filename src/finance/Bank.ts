import {BankUser} from "./BankUser";
import {IOUTicket} from "./IOUTicket";
import {UserManager} from "discord.js";
import {roundNumberTwoDecimals} from "../utils/utils";


class Bank {
    users: Map<string, BankUser>;
    iOUList: Array<IOUTicket>;
    #usernames: Set<string>;
    constructor() {
        this.users = new Map();
        this.iOUList = [];
        this.#usernames = new Set();
    }


    transferAmount(sender: BankUser, receiver: BankUser, amount: number): {success: boolean, failReason: string} {
        if (!amount) return {success: false, failReason: 'input error'};
        amount = roundNumberTwoDecimals(amount);
        if (sender.getBalance() < amount) {
            return {success: false, failReason: 'balance is too low'};
        }
        if (amount < 0) {
            return {success: false, failReason: 'cannot transfer negative balance'};
        }
        sender.subtractBalance(amount);
        receiver.addBalance(amount);
        return {success: true, failReason: ''};
    }

    createIOU(sender: BankUser, receiver: BankUser, reason: string) {
        const iou = new IOUTicket(sender.userId, receiver.userId, (new Date()).toDateString(), reason);
        this.iOUList.push(iou);
    }


    getIOUs() {
        return this.iOUList;
    }

    getUser(id: string) {
        return this.users.get(id);
    }

    getAllUsers() {
        return Array.from(this.users.values());
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
                ious: iouData
            }
        }
        return JSON.stringify(serializedData);
    }

    async deserializeAndLoadData(data: string, userManager: UserManager) {
        const parsedData = JSON.parse(data);
        for (let userObj of parsedData.bank.users) {
            try {
                const user = await userManager.fetch(userObj.userId);
                this.users.set(userObj.userId, new BankUser(user, userObj.name, userObj.balance));
            } catch(e) {
                console.log('could not load user data\n', e);
            }
        }
        for (let iou of parsedData.bank.ious) {
            this.iOUList.push(new IOUTicket(iou.senderID, iou.receiverID, iou.date, iou.comment));
        }
    }

    findUser(name: string): Array<BankUser> {
        const matches = [];
        for (const [, value] of this.users){
            if (value.name.toLowerCase().includes(name.toLowerCase())) {
                matches.push(value);
            }
        }
        matches.sort((a: BankUser, b: BankUser) => a.name.length - b.name.length);
        return matches;
    }
}

const bank = new Bank();
export {bank};
