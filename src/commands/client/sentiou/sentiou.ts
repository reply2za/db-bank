import { MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import { BankVisualizer } from '../../../finance/BankVisualizer';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserSentIOUs(event.bankUser.userId);
    if (ious.length < 1) {
        event.message.channel.send('*no sent IOUs found*');
        return;
    }
    await BankVisualizer.getSentIOUEmbed(ious).send(event.message.channel);
};
