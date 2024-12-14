import { MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import iouVisualizer from '../../../finance/visualizers/iouVisualizer';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserSentIOUs(event.bankUser.getUserId());
    if (ious.length < 1) {
        (<TextChannel>event.message.channel).send('*no sent IOUs found*');
        return;
    }
    await iouVisualizer.getSentIOUEmbed(ious).send(event.message.channel);
};
