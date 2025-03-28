import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    const wasSuccessful = bidManager.pauseBidEvent(event.channel.id);
    if (wasSuccessful) {
        await (<TextChannel>event.channel).send('Bid paused');
    } else {
        await (<TextChannel>event.channel).send('No bid found');
    }
};
