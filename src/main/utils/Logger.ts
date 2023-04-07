import { bot, config } from './constants/constants';
import { Message, TextChannel } from 'discord.js';
import { ILogger } from '@hoursofza/djs-common';

export class Logger implements ILogger {
    async errorLog(error: Error | string, additionalInfo = '[ERROR]') {
        console.log(additionalInfo, error);
        const body = typeof error === 'string' ? error : `${error.stack || error.message}`;
        const channel = await bot.channels.fetch(config.errorLogChID);
        if (channel) {
            return (<TextChannel>channel)?.send(`${additionalInfo} ${body}`);
        }
    }

    async infoLog(info: string) {
        return (<TextChannel>await bot.channels.fetch(config.infoLogChID))?.send(info);
    }

    async transactionLog(info: string) {
        (<TextChannel>await bot.channels.fetch(config.transactionLogChID))?.send(info);
    }

    async debugLog(error: Error): Promise<Message | undefined> {
        if (config.isDevMode) console.log(error);
        return;
    }
}

const logger = new Logger();

export default logger;
