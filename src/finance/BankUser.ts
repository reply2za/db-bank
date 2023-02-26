import { User } from 'discord.js';
import { roundNumberTwoDecimals } from '../utils/numberUtils';

class BankUser {
    readonly userId;
    readonly name;
    balance;
    readonly #discordUser;

    constructor(discordUser: User, name: string, balance: number) {
        this.userId = discordUser.id;
        this.name = name;
        this.balance = balance;
        this.#discordUser = discordUser;
    }

    setBalance(amount: number) {
        this.balance = amount;
        return this.balance;
    }

    addBalance(amount: number) {
        this.balance += amount;
        this.balance = roundNumberTwoDecimals(this.balance);
        return this.balance;
    }

    subtractBalance(amount: number) {
        this.balance -= amount;
        this.balance = roundNumberTwoDecimals(this.balance);
        return this.balance;
    }

    getBalance() {
        return this.balance;
    }

    getDiscordUser() {
        return this.#discordUser;
    }
}

export { BankUser };
