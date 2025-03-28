import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { bot, config } from '../../utils/constants/constants';
import { localStorage } from '../../storage/LocalStorage';
import { Message, TextChannel } from 'discord.js';
import fs from 'fs';
import axios from 'axios';
import logger from '../../utils/Logger';
let previousData: string;
exports.run = async (event: MessageEventLocal): Promise<void> => {
    if (event.args.length) {
        if (event.args[0].toLowerCase() === 'previous') {
            if (previousData) {
                (<TextChannel>event.channel).send(previousData);
            }
        }
        return;
    }
    if (!event.message) {
        const error = '[FATAL] Message object not found.';
        await (<TextChannel>event.channel).send(error);
        await logger.errorLog(error);
        return;
    }
    if (event.message.attachments) {
        previousData = bank.serializeData();
    }
    const success = await processDataFile(event.message);
    if (success) {
        await new Promise((res) => setTimeout(res, 1000));
        const data = localStorage.retrieveLocalData();
        await localStorage.saveData(data);
        await bank.deserializeAndLoadData(data, bot.users);
        (<TextChannel>event.channel).send('*contents changed*');
    } else {
        (<TextChannel>event.channel).send('*there was an issue processing the data*');
    }
};

/**
 * Processes the discord message containing the data file and saves it to the local data file.
 * @param message The message containing the file.
 */
async function processDataFile(message: Message): Promise<boolean> {
    if (!message.attachments?.first() || !message.attachments.first()!.name?.includes('.txt')) {
        return false;
    } else {
        return new Promise(async (res) => {
            const response = await axios({
                url: message.attachments.first()!.url,
                method: 'GET',
                responseType: 'stream',
            });
            let data = '';
            response.data.on('data', (chunk: string) => {
                data += chunk;
            });
            response.data.on('end', () => {
                try {
                    JSON.parse(data);
                } catch (e) {
                    res(false);
                    return;
                }
                fs.writeFileSync(config.dataFile, data);
                res(true);
            });
        });
    }
}
