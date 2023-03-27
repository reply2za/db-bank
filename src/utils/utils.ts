import {
    Collection,
    EmojiIdentifierResolvable,
    GuildTextBasedChannel,
    If,
    Message,
    MessageReaction,
    TextBasedChannel,
    User,
} from 'discord.js';
import { bank } from '../finance/Bank';
import { ADMIN_IDS, bot, isDevMode } from './constants/constants';
import { EventDataNames } from './types';
import { BankUserCopy } from '../finance/BankUser/BankUserCopy';

const getFilterForUser = (userId: string) => {
    return (m: Message) => userId === m.author.id;
};

export async function getUserResponse(
    channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>,
    userId: string
): Promise<Message | undefined> {
    try {
        const messages = await channel.awaitMessages({
            filter: getFilterForUser(userId),
            time: 60000,
            max: 1,
            errors: ['time'],
        });
        return messages.first();
    } catch (e) {}
}

/**
 * Searches the message for a mention. If there is none then searches the name. If there is no name then prompts the user.
 * @param message The user's message.
 * @param name Optional - A name of a user to search for.
 * @param actionName Optional - The name of the action that is being attempted
 * @param eventData Optional - Event data
 * @returns The BankUser to transfer to or undefined if the request failed or was cancelled.
 */
export async function getUserToTransferTo(
    message: Message,
    name = '',
    actionName = 'transfer',
    eventData = new Map<EventDataNames, any>()
): Promise<BankUserCopy | undefined> {
    let recipientID = message.mentions?.users.first()?.id;
    if (!name && !recipientID) {
        const initialTransferMsg = await message.channel.send(
            `Who you would like to ${actionName} to? *['q' = cancel]*`
        );
        eventData.set(EventDataNames.INITIAL_TRANSFER_MSG, initialTransferMsg);
        const newMsg = await getUserResponse(message.channel, message.author.id);
        // determines if abandoned, meaning that the same transfer is no longer active
        if (initialTransferMsg.id !== eventData.get(EventDataNames.INITIAL_TRANSFER_MSG)?.id) return;
        eventData.delete(EventDataNames.INITIAL_TRANSFER_MSG);
        if (!newMsg) {
            message.channel.send('*no response provided*');
            return;
        }
        recipientID = newMsg?.mentions?.users.first()?.id;
        if (!recipientID) {
            if (newMsg.content) {
                if (newMsg.content.toLowerCase() === 'q') {
                    message.channel.send('*cancelled*');
                    return;
                } else {
                    name = newMsg.content.split(' ')[0];
                }
            } else {
                message.channel.send(`must specify user to ${actionName} to`);
                return;
            }
        }
    }
    let recipientBankUser;
    if (recipientID) {
        recipientBankUser = bank.getUserCopy(recipientID);
    } else if (name) {
        const matchingUsers = bank.findUser(name);
        if (
            matchingUsers.length > 1 &&
            matchingUsers[0].getUsername().toLowerCase() === matchingUsers[1].getUsername().toLowerCase()
        ) {
            message.channel.send('*multiple users have that name, use @ mentions instead*');
            return;
        }
        recipientBankUser = matchingUsers[0];
    }
    if (!recipientBankUser) {
        const displayName = name.length < 30 ? name : `${name.substring(0, 30)}...`;
        message.channel.send(`*could not find user **${displayName}**, try using @ mentions instead*`);
        return;
    }
    if (recipientBankUser.getUserId() === message.author.id && !ADMIN_IDS.includes(`${message.author.id} `)) {
        message.channel.send(`you cannot make a ${actionName} to yourself`);
        return;
    }
    return recipientBankUser;
}

/**
 * Attaches a reaction with a reaction collector to a specific message.
 * @param reactMsg The message to attach the reaction to.
 * @param reactionUsers The list of users that can activate the effect of the reaction.
 * An empty list allows any user to activate the reaction. Will not be used if a custom filter is provided.
 * @param reactionsList The reactions to attach the message.
 * @param executeCallback A callback function for when any reaction is clicked.
 * @param endCallback Optional - A callback for when the reaction collector expires. If none then it will remove all reactions on the reactMsg.
 * @param filter Optional - A filter for the reactionCollector. If none is provided then follows the policy/description of reactionUsers.
 * @param filterTime Optional - The duration in which the reactionCollector is in effect.
 */
export async function attachReactionToMessage(
    reactMsg: Message,
    reactionUsers: User[],
    reactionsList: EmojiIdentifierResolvable[],
    executeCallback: (reaction: MessageReaction, user: User) => void,
    endCallback?: (collected: Collection<string, MessageReaction>, reason: string) => void,
    filter?: (reaction: MessageReaction, user: User) => boolean,
    filterTime = 30000
) {
    if (!endCallback) {
        endCallback = () => {
            reactMsg.reactions.removeAll().catch((error) => isDevMode && console.log(error));
        };
    }
    if (!filter) {
        filter = (reaction: MessageReaction, user: User) => {
            if (!reactionUsers.length) return true;
            return !!(
                reactionUsers.filter((rUser) => rUser.id === user.id).length &&
                reactionsList.includes(reaction.emoji.name!)
            );
        };
    }
    const collector = reactMsg.createReactionCollector({ filter, time: filterTime, dispose: true });
    collector.on('collect', executeCallback);
    collector.on('end', endCallback);
    for (const r of reactionsList) {
        await reactMsg.react(r);
    }
    return collector;
}

export function isAdmin(id: string): boolean {
    return ADMIN_IDS.includes(`${id} `);
}

/**
 * Assuming that there was a connection error. Tries to reconnect.
 */
export async function fixConnection(token: string): Promise<boolean> {
    let waitTimeMS = 10000;
    const retryText = (time: number) => `retrying in ${time / 1000} seconds...`;
    console.log(`no connection: ${retryText(waitTimeMS)}`);
    let retries = 0;
    const connect = async () => {
        waitTimeMS *= 2;
        console.log('connecting...');
        try {
            await bot.login(token);
            console.log('connected.');
            return true;
        } catch (e) {
            console.log(`connection failed.\n${retryText(waitTimeMS)}`);
            retries++;
            // if the wait time is greater than 10 minutes, then exit
            if (waitTimeMS > 60_000 * 10) {
                console.log(`failed to connect after ${retries} tries. exiting...`);
                process.exit(1);
            }
        }
        return false;
    };
    for (let i = 0; i < retries; i++) {
        await new Promise((resolve) => setTimeout(resolve, waitTimeMS));
        const res = await connect();
        if (res) return true;
    }
    return false;
}
