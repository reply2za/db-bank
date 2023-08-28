import {
    Collection,
    EmojiIdentifierResolvable,
    GuildTextBasedChannel,
    If,
    Message,
    MessageReaction,
    ReactionCollector,
    TextBasedChannel,
    User,
} from 'discord.js';
import { config } from './constants/constants';
import { processManager } from './ProcessManager';
import { TransferType } from '../finance/types';
import Logger from './Logger';

export async function getUserResponse(
    channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>,
    userId: string
): Promise<Message | undefined> {
    processManager.setUserResponseLock(userId, channel.id.toString());
    try {
        const messages = await channel.awaitMessages({
            filter: (m: Message) => userId === m.author.id,
            time: 60000,
            max: 1,
            errors: ['time'],
        });
        return messages.first();
    } catch {
    } finally {
        processManager.removeUserResponseLock(userId, channel.id.toString());
    }
}

/**
 * Attaches a reaction with a reaction collector to a specific message.
 * @param reactMsg The message to attach the reaction to.
 * @param reactionUserIds The list of userIds that can activate the effect of the reaction.
 * An empty list allows any author to activate the reaction. Will not be used if a custom filter is provided.
 * @param reactionsList The reactions to attach the message.
 * @param executeCallback A callback function for when any reaction is clicked.
 * @param endCallback Optional - A callback for when the reaction collector expires. If none then it will remove all reactions on the reactMsg.
 * @param filter Optional - A filter for the reactionCollector. If none is provided then follows the policy/description of reactionUsers.
 * @param filterTime Optional - The duration in which the reactionCollector is in effect.
 */
export async function attachReactionToMessage(
    reactMsg: Message,
    reactionUserIds: string[],
    reactionsList: EmojiIdentifierResolvable[],
    executeCallback: (reaction: MessageReaction, user: User, collector: ReactionCollector) => void,
    endCallback?: (collected: Collection<string, MessageReaction>, reason: string) => void,
    filter?: (reaction: MessageReaction, user: User) => boolean,
    filterTime = 30000
): Promise<ReactionCollector> {
    if (!endCallback) {
        endCallback = () => {
            reactMsg.reactions.removeAll().catch((error) => Logger.debugLog(error));
        };
    }
    if (!filter) {
        filter = (reaction: MessageReaction, user: User) => {
            if (!reactionUserIds.length) return true;
            return !!(
                reactionUserIds.filter((id) => id === user.id).length && reactionsList.includes(reaction.emoji.name!)
            );
        };
    }
    const collector = reactMsg.createReactionCollector({ filter, time: filterTime, dispose: true });
    collector.on('collect', (reaction, user) => executeCallback(reaction, user, collector));
    collector.on('end', endCallback);
    for (const r of reactionsList) {
        await reactMsg.react(r);
    }
    return collector;
}

export function isAdmin(id: string): boolean {
    return config.adminIDs.includes(`${id} `);
}

export function formatErrorText(text: string): string {
    return `error: \`${text}\``;
}

export function unitFormatFactory(transferType: TransferType): (amount: number) => string {
    if (transferType === TransferType.TRANSFER_IOU) {
        return (amount) => `${amount} IOU${amount === 1 ? '' : 's'}`;
    } else {
        return (amount) => `$${amount.toLocaleString()}`;
    }
}
