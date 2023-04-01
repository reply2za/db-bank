import { bot, config } from './constants/constants';
import { TextChannel } from 'discord.js';

export default class Logger {
    static async errorLog(error: Error | string, additionalInfo = '[ERROR]') {
        console.log(additionalInfo, error);
        const body = typeof error === 'string' ? error : `${error.stack || error.message}`;
        const channel = await bot.channels.fetch(config.errorLogChID);
        if (channel) {
            return (<TextChannel>channel)?.send(`${additionalInfo} ${body}`);
        }
    }

    static async infoLog(info: string) {
        return (<TextChannel>await bot.channels.fetch(config.infoLogChID))?.send(info);
    }

    static async transactionLog(info: string) {
        (<TextChannel>await bot.channels.fetch(config.transactionLogChID))?.send(info);
    }

    static debugLog(error: Error) {
        if (config.isDevMode) console.log(error);
    }
}
