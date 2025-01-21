import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import Logger from '../../utils/Logger';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const bidEvent = bidManager.getBidEvent(event.channel.id);
    if (bidEvent && !bidEvent.hasEnded()) {
        const message = await bidEvent.getBidEmbed().send(event.channel);
        await message.reply('There is already a bid in progress');
        return;
    }
    const wasSuccessful = await bidManager.resumeBidEvent(event.channel.id);
    if (wasSuccessful) {
        const bidEvent = bidManager.getBidEvent(event.channel.id);
        if (!bidEvent) {
            (<TextChannel>event.channel).send('Bid resumed');
            await Logger.errorLog('Bid resumed but no bid found');
            return;
        }
        const message = await bidEvent.getBidEmbed().send(event.channel);
        await message.reply('Bid resumed');
    } else {
        await (<TextChannel>event.channel).send('No bid found');
    }
};
