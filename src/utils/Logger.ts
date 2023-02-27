import { bot, isDevMode } from './constants/constants';
import { TextChannel } from 'discord.js';

export default class Logger {
    static errorLog(error: Error) {
        console.log(error);
        bot.channels.fetch('1064628593772220488').then((channel) => {
            error.stack && (<TextChannel>channel)?.send(error.stack);
        });
    }

    static async infoLog(info: string) {
        (<TextChannel>await bot.channels.fetch('1070859598627610746'))?.send(info);
    }

    static async transactionLog(info: string) {
        (<TextChannel>await bot.channels.fetch('1062859204177698958'))?.send(info);
    }

    static debugLog(error: Error) {
        if (isDevMode) console.log(error);
    }
}
