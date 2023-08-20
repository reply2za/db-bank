import fs from 'fs';
import { bot, config } from '../utils/constants/constants';
import { Message, TextChannel } from 'discord.js';
import logger from '../utils/Logger';

class LocalStorage {
    async #getDataMsg(): Promise<Message | undefined> {
        const channel = await bot.channels.fetch('1065729072287715329');
        return (<TextChannel>channel)?.messages.fetch('1065733201370288138');
    }

    async #retrieveDataFromDiscord(): Promise<string> {
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
        throw new Error('could not retrieve discord data');
    }

    async retrieveData(): Promise<string> {
        if (!config.isDevMode) {
            try {
                return await this.#retrieveDataFromDiscord();
            } catch (e: any) {
                await logger.errorLog(e, `[LocalStorage:retrieveData, ${e.message}]`);
            }
        }
        return this.retrieveLocalData();
    }

    retrieveLocalData(): string {
        return fs.readFileSync(config.dataFile).toString();
    }

    /**
     * Saves the data to the local file and discord.
     * @param serializedData
     */
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
