import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';

exports.run = async (event: MessageEventLocal) => {
    const wasSuccessful = bidManager.pauseBidEvent(event.message.channel.id);
    if (wasSuccessful) {
        await event.message.channel.send('Bid paused');
    } else {
        await event.message.channel.send('No bid found');
    }
};
