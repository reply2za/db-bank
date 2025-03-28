import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    const bidEvent = bidManager.getBidEvent(event.channel.id);
    if (bidEvent && !bidEvent.hasEnded()) {
        await bidEvent.cancelBidding();
    } else {
        (<TextChannel>event.channel).send('There is no active bid in this channel');
    }
};
