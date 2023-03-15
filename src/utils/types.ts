import { Message } from 'discord.js';
import { BankUserCopy } from '../finance/BankUser/BankUserCopy';

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
    bankUser: BankUserCopy;
    // additional data that can be added to the event
    data: EventData;
};

export type EventData = Map<EventDataNames, any>;

export enum EventDataNames {
    /*
    Message - active message object from the bot when starting a transfer
    - is created when a transfer message/request from the bot is sent
    - is deleted when a response is provided or timeouts
    */
    INITIAL_TRANSFER_MSG,
    /*
    {id: string, cmdName: string} - reaction transfer request id & command name
    - is created only when a transfer request is initiated from a reaction
    - is deleted when the request is complete
     */
    REACTION_TSFR_REQ,
    /*
    Message - The message that contains the Redeemable IOU Embed
    - is created when a redeem request is initiated from a reaction
     */
    REDEEM_IOU_EMBED_MSG,
}
