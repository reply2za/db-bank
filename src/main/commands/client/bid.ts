import { MessageEventLocal } from '../../utils/types';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { config } from '../../utils/constants/constants';
import { bidManager } from '../../finance/bid/BidManager';
function getNextDay(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate() + 1}/${date.getFullYear()}`;
}

function getTvBidDescription(date: Date): string {
    return `VIP TV access for ${getNextDay(date)}`;
}
exports.run = async (event: MessageEventLocal) => {
    let bidEvent = bidManager.getBidEvent(event.message.channel.id);
    const currentDate = new Date();
    if (event.message.channel.id === config.TV_BID_CH) {
        if (!bidEvent) {
            bidEvent = new BidEvent(<TextChannel>event.message.channel, getTvBidDescription(currentDate));
            bidManager.addBidEvent(event.message.channel.id, bidEvent);
            await bidEvent.startBidding();
        } else if (bidEvent.hasEnded()) {
            bidEvent.reset();
            bidEvent.setDescription(getTvBidDescription(currentDate));
            await bidEvent.startBidding();
        }
    }
    if (bidEvent) {
        if (!event.args[0]) {
            const endDate = bidEvent.getEndDateTime();
            if (bidEvent.getCurrentBidAmount() > 0 && bidEvent.getHighestBidder() && endDate && endDate < currentDate) {
                event.message.channel.send(
                    `Current bid: $${bidEvent.getCurrentBidAmount()} by ${bidEvent.getHighestBidder()?.getUsername()}`
                );
            } else {
                event.message.channel.send('There are no bids yet');
            }
            return;
        }
        if (bidEvent.hasEnded()) {
            event.message.channel.send('Bidding has ended');
            return;
        }
        const bid = Number(event.args[0].replace(/[$¢]/g, ''));
        if (isNaN(bid)) {
            event.message.channel.send('Bid must be a number');
            return;
        }
        await bidEvent.addBid(event.bankUser, bid);
    } else {
        event.message.channel.send('You can only bid in a designated bidding channel');
    }
};
