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
import { ADMIN_IDS } from './constants';
import { BankUser } from '../finance/BankUser';
import fs from 'fs';
import request from 'request';
import reactions from './reactions';

export function roundNumberTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

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
    } catch (e) {
        channel.send('*no response provided*');
        return;
    }
}

/**
 * Searches the message for a mention. If there is none then searches the name. If there is no name then prompts the user.
 * @param message
 * @param name
 * @param actionName
 */
export async function getUserToTransferTo(
    message: Message,
    name?: string,
    actionName = 'transfer'
): Promise<BankUser | undefined> {
    let recipientID = message.mentions?.users.first()?.id;
    if (!name && !recipientID) {
        message.channel.send(`Who you would like to ${actionName} to?`);
        const newMsg = await getUserResponse(message.channel, message.author.id);
        recipientID = newMsg?.mentions?.users.first()?.id;
        if (!recipientID) {
            if (!newMsg?.content) {
                message.channel.send(`must specify user to ${actionName} to`);
                return;
            } else {
                name = newMsg.content.split(' ')[0];
            }
        }
    }
    let recipientBankUser;
    if (recipientID) {
        recipientBankUser = bank.getUser(recipientID);
    } else if (name) {
        const matchingUsers = bank.findUser(name);
        recipientBankUser = matchingUsers[0];
    }
    if (!recipientBankUser) {
        message.channel.send('could not find user');
        return;
    }
    if (recipientBankUser.userId === message.author.id && !ADMIN_IDS.includes(`${message.author.id} `)) {
        message.channel.send(`you cannot make a ${actionName} to yourself`);
        return;
    }
    return recipientBankUser;
}

/**
 * Processes the discord message containing the data file.
 * @param message The message containing the file.
 */
export async function processDataFile(message: Message): Promise<boolean> {
    // sets the .env file
    return new Promise((res) => {
        if (!message.attachments?.first() || !message.attachments.first()!.name?.includes('.txt')) {
            res(false);
            return false;
        } else {
            request
                .get(message.attachments.first()!.url)
                .on('error', console.error)
                .once('complete', () => {
                    res(true);
                })
                .pipe(fs.createWriteStream('localData.txt'));
            return true;
        }
    });
}

/**
 * Attaches a reaction with a reaction collector to a specific message.
 * @param reactMsg The message to attach the reaction to.
 * @param reactionUsers The list of users that can activate the effect of the reaction.
 * @param reactionsList The reactions to attach the message.
 * @param executeCallback A callback function for when any reaction is clicked.
 * @param endCallback A callback for when the reaction collector expires.
 * @param filter Optional - A filter for the reactionCollector.
 * @param filterTime Optional - The duration in which the reactionCollector is in effect.
 */
export async function attachReactionToMessage(
    reactMsg: Message,
    reactionUsers: User[],
    reactionsList: EmojiIdentifierResolvable[],
    executeCallback: (reaction: MessageReaction, user: User) => void,
    endCallback: (collected: Collection<string, MessageReaction>, reason: string) => void,
    filter?: (reaction: MessageReaction, user: User) => boolean,
    filterTime = 30000
) {
    for (const r of reactionsList) {
        await reactMsg.react(r);
    }
    if (!filter) {
        filter = (reaction: MessageReaction, user: User) => {
            return !!(
                reactionUsers.filter((rUser) => rUser.id === user.id).length &&
                reactionsList.includes(reaction.emoji.name!)
            );
        };
    }
    const collector = reactMsg.createReactionCollector({ filter, time: filterTime, dispose: true });
    collector.on('collect', executeCallback);
    collector.once('end', endCallback);
}

export function isAdmin(id: string): boolean {
    return ADMIN_IDS.includes(`${id} `);
}
