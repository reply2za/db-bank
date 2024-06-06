import { MessageEventLocal } from '../../utils/types';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { config } from '../../utils/constants/constants';
import { bidManager } from '../../finance/bid/BidManager';
import { DayOfTheWeek } from '../../utils/enums';

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
        if (currentDate.getHours() === 0 && currentDate.getMinutes() === 0) {
            event.message.channel.send('Bidding for the next day will start at 12:01am');
            return;
        }
        if (!bidEvent || (bidEvent && bidEvent.hasEnded())) {
            bidEvent = new BidEvent(<TextChannel>event.message.channel, getTvBidDescription(currentDate));
            const weekendBidAmounts = { minBidAmount: 0.5, minBidIncrement: 0.5 };
            bidEvent.setDailyBidConfig(DayOfTheWeek.Friday, weekendBidAmounts);
            bidEvent.setDailyBidConfig(DayOfTheWeek.Saturday, weekendBidAmounts);
            const addedBidEvent = bidManager.addBidEvent(event.message.channel.id, bidEvent);
            if (!addedBidEvent) {
                event.message.channel.send('error creating new bid event');
                return;
            }
            await bidEvent.startBidding();
        }
    }
    if (bidEvent) {
        if (!event.args[0]) {
            const endDate = bidEvent.getEndDateTime();
            if (bidEvent.getCurrentBidAmount() > 0 && bidEvent.getHighestBidder() && endDate && endDate.isBefore(currentDate)) {
                event.message.channel.send(
                    `Current bid: $${bidEvent.getCurrentBidAmount()} by ${bidEvent.getHighestBidder()?.getUsername()}`
                );
            } else {
                event.message.channel.send('*There are no bids as of yet*');
            }
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
