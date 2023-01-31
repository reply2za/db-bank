import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';

export type MessageEventLocal = {
    statement: Readonly<string>;
    message: Message;
    args: string[];
    prefix: string;
    bankUser: BankUser;
};
