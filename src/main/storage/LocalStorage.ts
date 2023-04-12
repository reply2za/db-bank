import fs from 'fs';
import { bot, config } from '../utils/constants/constants';
import { Message, TextChannel } from 'discord.js';
import logger from '../utils/Logger';

class LocalStorage {
    async #getDataMsg(): Promise<Message | undefined> {
        const channel = await bot.channels.fetch('1065729072287715329');
        return (<TextChannel>channel)?.messages.fetch('1065733201370288138');
    }

    async retrieveData(): Promise<string> {
        if (!config.isDevMode) {
            // get data from discord
            const message = await this.#getDataMsg();
            const url = message?.attachments.first()?.url;
            if (url) {
                const res = await fetch(url);
                const bankData = await res.json();
                if (bankData) {
                    return JSON.stringify(bankData);
                }
            }
            await logger.warnLog('could not retrieve discord data, using local data');
        }
        return fs.readFileSync(config.dataFile).toString();
    }

    async saveData(serializedData: string) {
        try {
            fs.writeFileSync(config.dataFile, serializedData);
        } catch (e: unknown) {
            console.log(serializedData);
            await logger.errorLog(<Error>e, '[LocalStorage:saveData, failed local save]');
        }
        if (!config.isDevMode) {
            const dataPayloadMsg = await this.#getDataMsg();
            if (dataPayloadMsg) {
                await dataPayloadMsg
                    .edit({
                        content: `updated: ${new Date().toString()}`,
                        files: [
                            {
                                attachment: `./${config.dataFile}`,
                                name: config.dataFile,
                                description: 'db-bank data',
                            },
                        ],
                    })
                    .catch((e) => logger.errorLog(e, '[LocalStorage:saveData, failed discord save]'));
            } else {
                await logger.errorLog(
                    'failed to find data payload message',
                    '[LocalStorage:saveData, failed discord save]'
                );
            }
        }
    }
}

const localStorage = new LocalStorage();
export { localStorage };
