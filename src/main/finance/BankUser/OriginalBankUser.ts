import { User } from 'discord.js';
import { roundNumberTwoDecimals } from '../../utils/numberUtils';
import { ABankUser } from './ABankUser';
import { BankUserCopy } from './BankUserCopy';

class OriginalBankUser extends ABankUser {
    constructor(discordUser: User, name: string, balance: number) {
        super(discordUser, name, balance);
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

    getBankUserCopy(): BankUserCopy {
        return new BankUserCopy(this.discordUser, this.name, this.balance);
    }
}

export { OriginalBankUser };
