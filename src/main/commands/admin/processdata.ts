import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { bot, config } from '../../utils/constants/constants';
import { localStorage } from '../../storage/LocalStorage';
import { Message } from 'discord.js';
import fs from 'fs';
import axios from 'axios';
let previousData: string;
exports.run = async (event: MessageEventLocal) => {
    if (event.args[0].toLowerCase() === 'previous') {
        if (previousData) {
            event.message.channel.send(previousData);
        }
        return;
    }
    if (event.message.attachments) {
        previousData = bank.serializeData();
    }
    const success = await processDataFile(event.message);
    if (success) {
        await new Promise((res) => setTimeout(res, 700));
        const data = await localStorage.retrieveData();
        await localStorage.saveData(data);
        await bank.deserializeAndLoadData(data, bot.users);
        event.message.channel.send('*contents changed*');
    } else {
        event.message.channel.send('*there was an issue processing the data*');
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
        const response = await axios({
            url: message.attachments.first()!.url,
            method: 'GET',
            responseType: 'stream',
        });
        response.data.pipe(fs.createWriteStream(config.dataFile));
        return true;
    }
}
