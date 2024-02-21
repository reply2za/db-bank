import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import Logger from '../../utils/Logger';

exports.run = async (event: MessageEventLocal) => {
    const bidEvent = bidManager.getBidEvent(event.message.channel.id);
    if (bidEvent && !bidEvent.hasEnded()) {
        const message = await bidEvent.getBidEmbed().send(event.message.channel);
        await message.reply('There is already a bid in progress');
        return;
    }
    const wasSuccessful = await bidManager.resumeBidEvent(event.message.channel.id);
    if (wasSuccessful) {
        const bidEvent = bidManager.getBidEvent(event.message.channel.id);
        if (!bidEvent) {
            event.message.channel.send('Bid resumed');
            await Logger.errorLog('Bid resumed but no bid found');
            return;
        }
        const message = await bidEvent.getBidEmbed().send(event.message.channel);
        await message.reply('Bid resumed');
    } else {
        await event.message.channel.send('No bid found');
    }
};
