import {GuildTextBasedChannel, If, Message, TextBasedChannel} from "discord.js";

const {bot} = require('./constants');

export async function log(info: string) {
    (await bot.channels.fetch('1062859204177698958')).send(info);
}

export function roundNumberTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

const getFilterForUser = (userId: string) => {
    return (m: Message) => (userId === m.author.id);
};
export async function getUserResponse(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, userId: string): Promise<Message | undefined> {
    try {
        const messages = await channel.awaitMessages(
            { filter: getFilterForUser(userId), time: 60000, max: 1, errors: ['time'] }
        );
        return messages.first();
    } catch (e) {
        channel.send('*no response provided: cancelled transfer*');
        return;
    }
}

