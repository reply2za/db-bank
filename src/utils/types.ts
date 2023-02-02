import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';

export type MessageEventLocal = {
    // the command name, removes the prefix and any args
    statement: Readonly<string>;
    // The message object
    message: Message;
    // the message contents in an array
    args: string[];
    // the prefix used
    prefix: string;
    // the bank user initiating the event
    bankUser: BankUser;
};
