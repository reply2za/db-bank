import { EventDataNames, MessageEventLocal } from '../../utils/types';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { bot, config } from '../../utils/constants/constants';
import { bidManager } from '../../finance/bid/BidManager';
import { DayOfTheWeek } from '../../utils/enums';
import { getCurrentMoment } from '../../utils/utils';

function getNextDay(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate() + 1}/${date.getFullYear()}`;
}

function getTvBidDescription(date: Date): string {
    return `VIP TV access for ${getNextDay(date)}`;
}
exports.run = async (event: MessageEventLocal) => {
    const isMaxBid: Boolean = event.data.get(EventDataNames.IS_MAX_BID) === 'true';
    let bidChannelId: string;
    if (isMaxBid) {
        bidChannelId = config.TV_BID_CH;
    } else {
        bidChannelId = event.message.channel.id;
    }
    let bidEvent = bidManager.getBidEvent(bidChannelId);
    const currentDate = new Date();
    if (bidChannelId === config.TV_BID_CH) {
        if (!isMaxBid && currentDate.getHours() === 0 && currentDate.getMinutes() === 0) {
            (<TextChannel>event.message.channel).send('Bidding for the next day will start at 12:01am');
            return;
        }
        if (!bidEvent || (bidEvent && bidEvent.hasEnded())) {
            const bidChannel = await bot.channels.fetch(bidChannelId);
            bidEvent = new BidEvent(<TextChannel>bidChannel, getTvBidDescription(currentDate));
            const weekendBidAmounts = { minBidAmount: 0.5, minBidIncrement: 0.5 };
            bidEvent.setDailyBidConfig(DayOfTheWeek.Friday, weekendBidAmounts);
            bidEvent.setDailyBidConfig(DayOfTheWeek.Saturday, weekendBidAmounts);
            const addedBidEvent = bidManager.addBidEvent(bidChannelId, bidEvent);
            if (!addedBidEvent) {
                (<TextChannel>event.message.channel).send('error creating new bid event');
                return;
            }
            await bidEvent.startBidding();
        }
    }
    if (bidEvent) {
        if (!event.args[0]) {
            const endDate = bidEvent.getEndDateTime();
            if (
                bidEvent.getCurrentBidAmount() > 0 &&
                bidEvent.getHighestBidder() &&
                endDate &&
                endDate.isBefore(currentDate)
            ) {
                (<TextChannel>event.message.channel).send(
                    `Current bid: $${bidEvent.getCurrentBidAmount()} by ${bidEvent.getHighestBidder()?.getUsername()}`
                );
            } else {
                (<TextChannel>event.message.channel).send('*There are no bids as of yet*');
            }
            return;
        }
        let bid;
        if (isMaxBid) {
            const nextBidMinimum = bidEvent.getCurrentBidAmount() + bidEvent.getMinBidIncrement();
            if (event.bankUser.getMaxBid(getCurrentMoment()) >= nextBidMinimum) {
                bid = nextBidMinimum;
            } else {
                const highestBidderId = bidEvent.getHighestBidder()?.getUserId();
                if (highestBidderId && highestBidderId !== event.bankUser.getUserId()) {
                    event.bankUser.getDiscordUser().send('your max bid is less than the current bid!');
                } else {
                    event.bankUser.getDiscordUser().send('there was an error sending your max bid');
                }
                return;
            }
        } else {
            bid = Number(event.args[0].replace(/[$¢]/g, ''));
            if (isNaN(bid)) {
                (<TextChannel>event.message.channel).send('Bid must be a number');
                return;
            }
        }
        await bidEvent.addBid(event.bankUser, bid);
    } else {
        (<TextChannel>event.message.channel).send('You can only bid in a designated bidding channel');
    }
};
