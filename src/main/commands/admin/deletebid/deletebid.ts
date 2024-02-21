import { MessageEventLocal } from '../../../utils/types';
import { bidManager } from '../../../finance/bid/BidManager';

exports.run = async (event: MessageEventLocal) => {
    //deletebid command
    const wasSuccessful = await bidManager.deleteBidEvent(event.message.channel.id);
    if (wasSuccessful) {
        await event.message.channel.send('Bid deleted');
    } else {
        await event.message.channel.send('No bid found');
    }
};
