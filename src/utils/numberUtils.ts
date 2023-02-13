import { TextBasedChannel } from 'discord.js';
import EmbedBuilderLocal from './EmbedBuilderLocal';
import { getUserResponse } from './utils';
import { BankUser } from '../finance/BankUser';

export async function getAmount(channel: TextBasedChannel, senderId: string) {
    const enterAmountMsg = await new EmbedBuilderLocal()
        .setDescription('enter the amount you would like to send')
        .setFooter('or `q` to quit')
        .send(channel);
    const response = await getUserResponse(channel, senderId);
    enterAmountMsg.deletable && enterAmountMsg.delete();
    return response?.content;
}

/**
 * Returns whether the amount provided is acceptable.
 * @param transferAmount
 * @param channel
 * @param sender
 */
export function validateMonetaryAmount(
    transferAmount: any,
    sender: Readonly<BankUser>,
    channel?: TextBasedChannel
): boolean {
    if (!validateAmount(transferAmount, channel)) return false;
    if (transferAmount > sender.balance) {
        channel?.send('*cancelled transfer: `balance is too low`*');
        return false;
    }
    return true;
}

/**
 * Returns whether the amount provided is acceptable.
 * @param transferAmount
 * @param channel
 */
export function validateAmount(transferAmount: any, channel?: TextBasedChannel): boolean {
    if (!Number.isFinite(transferAmount)) {
        channel?.send('*cancelled transfer: `invalid input`*');
        return false;
    }
    if (transferAmount <= 0) {
        channel?.send('*cancelled transfer: `amount must be greater than 0`*');
        return false;
    }
    return true;
}
