import { MessageEventLocal } from '../../utils/types';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { config } from '../../utils/constants/constants';
let bidEvent: BidEvent | null = null;
exports.run = async (event: MessageEventLocal) => {
    if (event.message.channel.id === config.TV_BID_CH) {
        if (!event.args[0]) {
            if (bidEvent && bidEvent.getCurrentBidAmount() > 0 && bidEvent.getHighestBidder()) {
                event.message.channel.send(
                    `Current bid: $${bidEvent.getCurrentBidAmount()} by ${bidEvent.getHighestBidder()?.getUsername()}`
                );
            } else {
                event.message.channel.send('There are no bids yet');
            }
            return;
        }
        const bid = Number(event.args[0]);
        if (!isNaN(bid)) {
            if (!bidEvent) {
                const date = new Date();
                const dateString = `${date.getMonth() + 1}/${date.getDate() + 1}/${date.getFullYear()}`;
                bidEvent = new BidEvent(<TextChannel>event.message.channel, `VIP TV access for ${dateString}`);
                await bidEvent.startBidding();
            }
            await bidEvent.addBid(event.bankUser, bid);
        }
        return;
    } else {
        event.message.channel.send('You can only bid in a designated bidding channel');
    }
};
