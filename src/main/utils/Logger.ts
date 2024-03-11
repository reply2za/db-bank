import { bot, config } from './constants/constants';
import { Message, TextChannel } from 'discord.js';
import { ILogger } from '@hoursofza/djs-common';

class Logger implements ILogger {
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

    /**
     * Logs the error to the console if in dev mode.
     * @param error The error to log.
     * @param from Optional - The function or class that the error originated from.
     */
    async debugLog(error: Error, from?: string): Promise<Message | undefined> {
        if (config.isDevMode) console.log('[DEBUG_LOG] ', `[${from}] `, error);
        return;
    }

    async warnLog(warning: string): Promise<Message | undefined> {
        try {
            return await (<TextChannel>await bot.channels.fetch(config.warnLogChID))?.send(warning);
        } catch (e: any) {
            console.error(e.message);
            console.log(`[WARN] ${warning}`);
        }
        return;
    }
}

const logger = new Logger();

export default logger;
