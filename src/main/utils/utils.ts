import {
    Collection,
    EmojiIdentifierResolvable,
    GuildTextBasedChannel,
    If,
    Message,
    MessageReaction,
    TextBasedChannel,
    TextChannel,
    User,
} from 'discord.js';
import { bot, config } from './constants/constants';
import { processManager } from './ProcessManager';

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
    executeCallback: (reaction: MessageReaction, user: User) => void,
    endCallback?: (collected: Collection<string, MessageReaction>, reason: string) => void,
    filter?: (reaction: MessageReaction, user: User) => boolean,
    filterTime = 30000
) {
    if (!endCallback) {
        endCallback = () => {
            reactMsg.reactions.removeAll().catch((error) => config.isDevMode && console.log(error));
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
    collector.on('collect', executeCallback);
    collector.on('end', endCallback);
    for (const r of reactionsList) {
        await reactMsg.react(r);
    }
    return collector;
}

export function isAdmin(id: string): boolean {
    return config.adminIDs.includes(`${id} `);
}

/**
 * If active then update the process log, otherwise fetch a channel to check connection status.
 */
export function updateProcessLog() {
    const MINUTES = 60;
    const FETCH_INTERVAL = 1000 * 60 * MINUTES;
    const checkConnection = () => {
        if (processManager.isLoggedIn()) {
            if (processManager.isActive()) {
                bot.channels.fetch(config.processLog).then(async (msg) => {
                    await (<TextChannel>msg).send(
                        `~db-bank[v${processManager.version}][${config.hardwareTag}][${process.pid}](${config.prefix})`
                    );
                });
            } else {
                // fetch to check connection
                bot.channels.fetch(config.processLog, { force: true });
            }
        }
    };
    checkConnection();
    setInterval(() => {
        checkConnection();
    }, FETCH_INTERVAL);
}
