import { GuildTextBasedChannel, If, Message, TextBasedChannel } from 'discord.js';
import { bank } from '../finance/Bank';
import { ADMIN_IDS } from './constants';
import { BankUser } from '../finance/BankUser';

const { bot } = require('./constants');

export async function log(info: string) {
    (await bot.channels.fetch('1062859204177698958')).send(info);
}

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
        channel.send('*no response provided: cancelled transfer*');
        return;
    }
}

/**
 * Searches the message for a mention. If there is none then searches the name. If there is no name then prompts the user.
 * @param message
 * @param name
 */
export async function getUserToTransferTo(message: Message, name?: string): Promise<BankUser | undefined> {
    let recipientID = message.mentions?.users.first()?.id;
    if (!name && !recipientID) {
        message.channel.send('Who you would like to transfer to?');
        const newMsg = await getUserResponse(message.channel, message.author.id);
        recipientID = newMsg?.mentions?.users.first()?.id;
        if (!recipientID) {
            if (!newMsg?.content) {
                message.channel.send('must specify user to send to');
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
        message.channel.send('you cannot make a transfer to yourself');
        return;
    }
    return recipientBankUser;
}

export function isAdmin(id: string): boolean {
    return ADMIN_IDS.includes(`${id} `);
}
