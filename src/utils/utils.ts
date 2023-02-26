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
        message.channel.send('*could not find user*');
        return;
    }
    if (recipientBankUser.userId === message.author.id && !ADMIN_IDS.includes(`${message.author.id} `)) {
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
 * @param endCallback A callback for when the reaction collector expires.
 * @param filter Optional - A filter for the reactionCollector. If none is provided then follows the policy/description of reactionUsers.
 * @param filterTime Optional - The duration in which the reactionCollector is in effect.
 */
export async function attachReactionToMessage(
    reactMsg: Message,
    reactionUsers: User[],
    reactionsList: EmojiIdentifierResolvable[],
    executeCallback: (reaction: MessageReaction, user: User) => void,
    endCallback = async (collected: Collection<string, MessageReaction>, reason: string) => {
        reactMsg.reactions.removeAll().catch();
    },
    filter?: (reaction: MessageReaction, user: User) => boolean,
    filterTime = 30000
) {
    for (const r of reactionsList) {
        await reactMsg.react(r);
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
    collector.once('end', endCallback);
    return collector;
}

export function isAdmin(id: string): boolean {
    return ADMIN_IDS.includes(`${id} `);
}
