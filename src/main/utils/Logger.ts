import { bot, config } from './constants/constants';
import { Message, TextChannel } from 'discord.js';
import { EmbedBuilderLocal, ILogger } from '@hoursofza/djs-common';
import { ABankUser } from '../finance/BankUser/ABankUser';
import { TransferRedemptionType } from '../finance/types';
import { unitFormatFactory } from './utils';

class Logger implements ILogger {
    async errorLog(error: Error | string, additionalInfo = '[ERROR]') {
        console.log(additionalInfo, error);
        const body = typeof error === 'string' ? error : `${error.stack || error.message}`;
        const channel = await bot.channels.fetch(config.errorLogChID);
        if (channel) {
            return (<TextChannel>channel)?.send(`${additionalInfo} ${body}`);
        }
        return;
    }

    async infoLog(info: string) {
        return (<TextChannel>await bot.channels.fetch(config.infoLogChID))?.send(info);
    }

    async transactionLog(info: string) {
        for (const chId of config.transactionLogChID) {
            (<TextChannel>await bot.channels.fetch(chId))?.send(info);
        }
    }

    async simpleTransactionLog(
        sender: ABankUser,
        receiver: ABankUser,
        transferType: TransferRedemptionType,
        amount: number,
        comment: string,
        additionalText?: string
    ) {
        const truncatedIdLength = 7;
        const unitFormatter = unitFormatFactory(transferType);
        const footerText = `[${sender.getDBName()} -> ${receiver.getDBName()}] [${this.truncateDisplayEnding(sender.getUserId(), truncatedIdLength)},${this.truncateDisplayEnding(receiver.getUserId(), truncatedIdLength)}]`;
        let embed = new EmbedBuilderLocal()
            .setTitle(`${transferType.toString()}: ${sender.getUsername()} -> ${receiver.getUsername()}\n`)
            .setDescription(
                `amount: ${unitFormatter(amount)}\ncomment: ${comment}${additionalText ? `\n${additionalText}` : ''}`
            )
            .setFooter({
                iconURL: sender.getDiscordUser().displayAvatarURL(),
                text: footerText,
            })
            .setThumbnail(receiver.getDiscordUser().displayAvatarURL());
        for (const chId of config.simpleTransactionLogChID) {
            const channel = <TextChannel>await bot.channels.fetch(chId);
            await embed.send(channel);
        }
    }

    truncateDisplayEnding(str: string, count: number) {
        return str.substring(str.length - count);
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
