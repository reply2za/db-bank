import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[0]) {
        event.message.channel.send('You must specify a date in the format of MM/DD/YYYY HH:MM:SS');
        return;
    }
    if (!event.args[1]) {
        event.message.channel.send('You must specify a description');
        return;
    }
    const endDate = new Date(event.args[0]);
    const timeArr = event.args[1].split(':');
    endDate.setHours(Number(timeArr[0]), Number(timeArr[1]), Number(timeArr[2]));
    if (isNaN(endDate.getTime())) {
        event.message.channel.send('Invalid date');
        return;
    }
    let bidEvent = bidManager.getBidEvent(event.message.channel.id);
    const description = event.args.slice(2).join(' ');
    if (bidEvent) {
        bidEvent.setDescription(description);
        bidEvent.setEndDateTime(endDate);
    } else {
        bidEvent = new BidEvent(<TextChannel>event.message.channel, description);
        bidManager.addBidEvent(event.message.channel.id, bidEvent);
    }
    await bidEvent.startBidding();
};
