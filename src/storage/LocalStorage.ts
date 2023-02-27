import fs from 'fs';
import { bot, isDevMode } from '../utils/constants/constants';
import { Message, TextChannel } from 'discord.js';

class LocalStorage {
    FILE_NAME = 'localData.txt';

    async #getDataMsg(): Promise<Message | undefined> {
        const channel = await bot.channels.fetch('1065729072287715329');
        return (<TextChannel>channel)?.messages.fetch('1065733201370288138');
    }

    async retrieveData() {
        return fs.readFileSync(this.FILE_NAME).toString();
    }

    async saveData(serializedData: string) {
        try {
            fs.writeFileSync(this.FILE_NAME, serializedData);
        } catch (e) {}
        if (!isDevMode) {
            const message = await this.#getDataMsg();
            if (message) {
                await message.edit({
                    content: `updated: ${new Date().toString()}`,
                    files: [
                        {
                            attachment: './localData.txt',
                            name: 'localData.txt',
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
