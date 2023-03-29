import fs from 'fs';
import { bot, DATA_FILE, HARDWARE_TAG, isDevMode } from '../utils/constants/constants';
import { Message, TextChannel } from 'discord.js';
import { processManager } from '../utils/ProcessManager';

class LocalStorage {
    async #getDataMsg(): Promise<Message | undefined> {
        const channel = await bot.channels.fetch('1065729072287715329');
        return (<TextChannel>channel)?.messages.fetch('1065733201370288138');
    }

    async retrieveData() {
        return fs.readFileSync(DATA_FILE).toString();
    }

    async saveData(serializedData: string) {
        try {
            fs.writeFileSync(DATA_FILE, serializedData);
        } catch (e) {}
        if (!isDevMode) {
            const dataPayloadMsg = await this.#getDataMsg();
            if (dataPayloadMsg) {
                await dataPayloadMsg.edit({
                    content: `updated: ${new Date().toString()}`,
                    files: [
                        {
                            attachment: `./${DATA_FILE}`,
                            name: DATA_FILE,
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
