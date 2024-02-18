import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { getUserResponse } from '../../utils/utils';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[0]) {
        await new EmbedBuilderLocal()
            .setDescription('What is the date and time of the bid? (MM/DD/YYYY HH:MM:SS)')
            .send(event.message.channel);
        const resp = (await getUserResponse(event.message.channel, event.message.author.id))?.content.split(' ');
        if (!resp) {
            event.message.channel.send('Cancelled: You must specify a date and time');
            return;
        }
        if (resp.length === 1) {
            if (resp[0].includes(':')) resp.unshift(new Date().toLocaleDateString());
            else {
                event.message.channel.send('Cancelled: You must specify a time');
                return;
            }
        }
        event.args = resp;
    }
    if (!event.args[2]) {
        await new EmbedBuilderLocal()
            .setDescription('What is the description of the bid? [q=cancel]')
            .send(event.message.channel);
        const resp = (await getUserResponse(event.message.channel, event.message.author.id))?.content;
        if (!resp || resp.toLowerCase() === 'q') {
            event.message.channel.send('Cancelled: You must specify a description');
            return;
        }
        event.args.push(resp);
    }
    const endDate = new Date(event.args[0]);
    const timeArr = event.args[1].split(':');
    endDate.setHours(Number(timeArr[0]), Number(timeArr[1]), Number(timeArr[2]));
    if (isNaN(endDate.getTime())) {
        event.message.channel.send('Invalid date');
        return;
    }
    if (endDate.getTime() <= new Date().getTime()) {
        event.message.channel.send('Date must be in the future');
        return;
    }
    let bidEvent = bidManager.getBidEvent(event.message.channel.id);
    const description = event.args.slice(2).join(' ');
    if (bidEvent) {
        bidEvent.setDescription(description);
        bidEvent.setEndDateTime(endDate);
    } else {
        bidEvent = new BidEvent(<TextChannel>event.message.channel, description);
        bidEvent.setEndDateTime(endDate);
        bidManager.addBidEvent(event.message.channel.id, bidEvent);
    }
    await bidEvent.startBidding();
};
