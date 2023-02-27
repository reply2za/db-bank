import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';

export type MessageEventLocal = {
    // the command name, removes the prefix and any args
    statement: Readonly<string>;
    // the message object
    message: Message;
    // the message contents in an array
    args: string[];
    // the prefix used
    prefix: string;
    // the bank user initiating the event
    bankUser: BankUser;
    // additional data that can be added to the event
    data: Map<string, any>;
};

/*
Data fields
[name, type] - explanation
INITIAL_TRANSFER_MSG, Message - the initial message object from the bot when starting a transfer
REACTION_TSFR_REQ, string - contains an id for a reaction transfer request only when it is in progress
 */
