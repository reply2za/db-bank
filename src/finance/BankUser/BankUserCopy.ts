import { ABankUser } from './ABankUser';
import { User } from 'discord.js';

export class BankUserCopy extends ABankUser {
    constructor(discordUser: User, name: string, balance: number) {
        super(discordUser, name, balance);
    }
}
