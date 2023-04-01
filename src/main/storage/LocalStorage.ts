import fs from 'fs';
import { bot, config } from '../utils/constants/constants';
import { Message, TextChannel } from 'discord.js';
import Logger from '../utils/Logger';
import { processManager } from '../utils/ProcessManager';

class LocalStorage {
    async #getDataMsg(): Promise<Message | undefined> {
        const channel = await bot.channels.fetch('1065729072287715329');
        return (<TextChannel>channel)?.messages.fetch('1065733201370288138');
    }

    async retrieveData() {
        return fs.readFileSync(config.dataFile).toString();
    }

    async saveData(serializedData: string) {
        try {
            fs.writeFileSync(config.dataFile, serializedData);
        } catch (e: unknown) {
            processManager.handleErrors(<Error>e, '[LocalStorage, saveData]').catch((e) => console.log(e));
        }
        if (!config.isDevMode) {
            const dataPayloadMsg = await this.#getDataMsg();
            if (dataPayloadMsg) {
                await dataPayloadMsg.edit({
                    content: `updated: ${new Date().toString()}`,
                    files: [
                        {
                            attachment: `./${config.dataFile}`,
                            name: config.dataFile,
                            description: 'db-bank data',
                        },
                    ],
                });
            }
        }
    }
}

const localStorage = new LocalStorage();
export { localStorage };
