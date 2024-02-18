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
import { bot, config } from './constants/constants';
import { processManager } from './ProcessManager';
import { TransferType } from '../finance/types';
import { attachReactionsToMessage } from '../../../../djs-common/src/main/utils/utils';

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
