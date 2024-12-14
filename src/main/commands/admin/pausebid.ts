import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const wasSuccessful = bidManager.pauseBidEvent(event.message.channel.id);
    if (wasSuccessful) {
        await (<TextChannel>event.message.channel).send('Bid paused');
    } else {
        await (<TextChannel>event.message.channel).send('No bid found');
    }
};
