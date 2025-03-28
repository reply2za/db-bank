import { MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import iouVisualizer from '../../../finance/visualizers/iouVisualizer';
import { SlashCommandBuilder, TextChannel } from 'discord.js';
import path from 'node:path';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    const ious = bank.getUserSentIOUs(event.bankUser.getUserId());
    if (ious.length < 1) {
        (<TextChannel>event.channel).send('*no sent IOUs found*');
        return;
    }
    await iouVisualizer.getSentIOUEmbed(ious).send(event.channel);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName(path.basename(__filename).split('.')[0])
        .setDescription('View IOUs you have sent'),
    run: exports.run,
};
