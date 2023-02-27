import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { bot } from '../../utils/constants/constants';
import { localStorage } from '../../storage/LocalStorage';
import { Message } from 'discord.js';
import request from 'request';
import fs from 'fs';

exports.run = async (event: MessageEventLocal) => {
    const success = await processDataFile(event.message);
    if (success) {
        await new Promise((res) => setTimeout(res, 700));
        const data = await localStorage.retrieveData();
        await bank.deserializeAndLoadData(data, bot.users);
        event.message.channel.send('*contents changed*');
    } else {
        event.message.channel.send('*there was an issue processing the data*');
    }
};

/**
 * Processes the discord message containing the data file.
 * @param message The message containing the file.
 */
async function processDataFile(message: Message): Promise<boolean> {
    // sets the .env file
    return new Promise((res) => {
        if (!message.attachments?.first() || !message.attachments.first()!.name?.includes('.txt')) {
            res(false);
            return false;
        } else {
            request
                .get(message.attachments.first()!.url)
                .on('error', console.error)
                .once('complete', () => {
                    res(true);
                })
                .pipe(fs.createWriteStream('localData.txt'));
            return true;
        }
    });
}
