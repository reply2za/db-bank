import { MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import iouVisualizer from '../../../finance/visualizers/iouVisualizer';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserSentIOUs(event.bankUser.userId);
    if (ious.length < 1) {
        event.message.channel.send('*no sent IOUs found*');
        return;
    }
    await iouVisualizer.getSentIOUEmbed(ious).send(event.message.channel);
};
