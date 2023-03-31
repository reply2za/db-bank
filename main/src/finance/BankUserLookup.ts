import { bank, Bank } from './Bank';

export class BankUserLookup {
    readonly #bank: Bank;

    constructor(bank: Bank) {
        this.#bank = bank;
    }

    getUser(userId: string) {
        return this.#bank.getUserCopy(userId);
    }

    findUser(name: string) {
        return this.#bank.findUser(name);
    }
}

export const bankUserLookup = new BankUserLookup(bank);
