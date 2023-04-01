import { bot, config } from './constants/constants';
import { TextChannel } from 'discord.js';

export default class Logger {
    static async errorLog(error: Error, additionalInfo = '[ERROR]') {
        console.log(additionalInfo, error);
        const channel = await bot.channels.fetch(config.errorLogChID);
        if (channel) {
            await (<TextChannel>channel)?.send(`${additionalInfo} ${error.stack || error.message}`);
        }
    }

    static async infoLog(info: string) {
        (<TextChannel>await bot.channels.fetch(config.infoLogChID))?.send(info);
    }

    static async transactionLog(info: string) {
        (<TextChannel>await bot.channels.fetch(config.transactionLogChID))?.send(info);
    }

    static debugLog(error: Error) {
        if (config.isDevMode) console.log(error);
    }
}
