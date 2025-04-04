import { BankUserCopy } from '../finance/BankUser/BankUserCopy';
import { MessageEventCore } from '@hoursofza/djs-common';
import { TextBasedChannel } from 'discord.js';

export type MessageEventLocal = MessageEventCore<EventDataNames> & {
    // the bank author initiating the event
    bankUser: BankUserCopy;
    channel: TextBasedChannel;
};

export enum EventDataNames {
    /**
    {Message} - active message object from the bot when starting a transfer
    - is created when a transfer message/request from the bot is sent
    - is deleted when a response is provided or timeouts
    */
    INITIAL_TRANSFER_MSG,
    /**
    {id: string, cmdName: string} - reaction transfer request id & command name
    - is created only when a transfer request is initiated from a reaction
    - is deleted when the request is complete
     */
    REACTION_TSFR_REQ,
    /**
    {Message} - The message that contains the Redeemable IOU Embed
    - is created when a redeem request is initiated from a reaction
     */
    REDEEM_IOU_EMBED_MSG,
    /**
    {id: string} - the request for the amount to transfer
     */
    TRANSFER_AMOUNT_REQ,

    /**
     * {string[]} - the users that the author has transferred to. The last user is the most recent.
     */
    AUTHOR_INTERACT_HISTORY,
    /**
     * Whether the bot is initiating a max bid req on behalf of a user.
     * value is either 'true', 'false', or undefined
     */
    IS_MAX_BID,
    /**
     * {boolean} - Whether to print the command responses to the event's text channel.
     */
    IS_SILENT,
}

export type MessageChannel = TextBasedChannel;
