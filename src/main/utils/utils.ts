import { GuildTextBasedChannel, If, Message, TextBasedChannel, TextChannel } from 'discord.js';
import { config } from './constants/constants';
import { processManager } from './ProcessManager';
import { RedemptionType, TransferRedemptionType, TransferType } from '../finance/types';
import moment from 'moment';

export async function getUserResponse(
    channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>,
    userId: string
): Promise<Message | undefined> {
    processManager.setUserResponseLock(userId, channel.id.toString());
    try {
        const messages = await (<TextChannel>channel).awaitMessages({
            filter: (m: Message) => userId === m.author.id,
            time: 60000,
            max: 1,
            errors: ['time'],
        });
        return messages.first();
    } catch (e: any) {
        /* Intentionally left blank */
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

/**
 * Given a transfer or redemption type, returns a function that formats a number into an amount with the correct unit.
 * @param transferType The transfer type to format the amount for.
 */
export function unitFormatFactory(transferType: TransferRedemptionType): (amount: number) => string {
    if (transferType === TransferType.TRANSFER_IOU || transferType === RedemptionType.REDEEM_IOU) {
        return (amount) => `${amount} IOU${amount === 1 ? '' : 's'}`;
    } else {
        return (amount) => `$${amount.toLocaleString()}`;
    }
}

export function formatDate(date: Date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().substring(2)}`;
}

export function getCurrentMoment(): moment.Moment {
    const date = new Date();
    const month = date.getMonth() + 1;
    if (month > 3 && month < 11) {
        return getMomentEDT();
    } else if (month < 3 || month > 11) {
        return getMomentEST();
    } else {
        const dateNum = date.getDate();
        if (month == 3) {
            if (dateNum >= 10) {
                return getMomentEDT();
            } else return getMomentEST();
        } else {
            if (dateNum >= 3) {
                return getMomentEST();
            }
        }
        return getMomentEDT();
    }
}

export function getMomentEDT() {
    return moment(Date.now()).utcOffset('-0400');
}

export function getMomentEST() {
    return moment(Date.now()).utcOffset('-0500');
}
