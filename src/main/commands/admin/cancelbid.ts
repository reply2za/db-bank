import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const bidEvent = bidManager.getBidEvent(event.message.channel.id);
    if (bidEvent && !bidEvent.hasEnded()) {
        await bidEvent.cancelBidding();
    } else {
        (<TextChannel>event.message.channel).send('There is no active bid in this channel');
    }
};
