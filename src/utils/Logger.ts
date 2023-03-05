import { bot, ERROR_LOG_CH_ID, INFO_LOG_CH_ID, isDevMode, TRANSACTION_LOG_CH_ID } from './constants/constants';
import { TextChannel } from 'discord.js';

export default class Logger {
    static errorLog(error: Error) {
        console.log(error);
        bot.channels.fetch(ERROR_LOG_CH_ID).then((channel) => {
            error.stack && (<TextChannel>channel)?.send(error.stack);
        });
    }

    static async infoLog(info: string) {
        (<TextChannel>await bot.channels.fetch(INFO_LOG_CH_ID))?.send(info);
    }

    static async transactionLog(info: string) {
        (<TextChannel>await bot.channels.fetch(TRANSACTION_LOG_CH_ID))?.send(info);
    }

    static debugLog(error: Error) {
        if (isDevMode) console.log(error);
    }
}
