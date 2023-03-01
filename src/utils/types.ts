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
[INITIAL_TRANSFER_MSG, Message] - active message object from the bot when starting a transfer
- is created when a transfer message/request from the bot is sent
- is deleted when a response is provided or timeouts
[REACTION_TSFR_REQ, {id: string, cmdName: string}] - reaction transfer request
- contains an id and command-name for a reaction transfer request only when it is in progress
- is created only when a transfer request is initiated from a reaction
- is deleted when the request is complete

 */
