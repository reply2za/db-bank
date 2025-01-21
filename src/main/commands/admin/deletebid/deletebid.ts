import { MessageEventLocal } from '../../../utils/types';
import { bidManager } from '../../../finance/bid/BidManager';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    //deletebid command
    const wasSuccessful = await bidManager.deleteBidEvent(event.channel.id);
    if (wasSuccessful) {
        await (<TextChannel>event.channel).send('Bid deleted');
    } else {
        await (<TextChannel>event.channel).send('No bid found');
    }
};
