import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { getUserResponse } from '../../utils/utils';

exports.run = async (event: MessageEventLocal) => {
    let bidEvent = bidManager.getBidEvent(event.message.channel.id);
    if (bidEvent && !bidEvent.hasEnded()) {
        const msg = await bidEvent.getBidEmbed().send(event.message.channel);
        await msg.reply('There is already a bid in progress');
        return;
    }
    let isDefaultDateTime = false;
    let day;
    let time;
    if (event.args[0]) {
        if (event.args[0].toLowerCase() === 'default') isDefaultDateTime = true;
        if (event.args[0].toLowerCase() === 'q') {
            await event.message.channel.send('*cancelled*');
            return;
        }
        if (event.args[0].includes('/')) {
            day = event.args[0];
        } else if (event.args[0].includes(':')) {
            day = new Date().toLocaleDateString();
            time = event.args[0];
        }
        if (event.args[1] && event.args[1].includes(':')) {
            time = event.args[1];
        }
    } else {
        await new EmbedBuilderLocal()
            .setDescription("What is the date and time of the bid? (MM/DD/YYYY HH:MM:SS) or 'default' [q=cancel]")
            .send(event.message.channel);
        const resp = (await getUserResponse(event.message.channel, event.message.author.id))?.content.split(' ');
        if (!resp) {
            await event.message.channel.send('cancelled: You must specify a date and time');
            return;
        }
        if (resp.length === 1) {
            if (resp[0].includes(':')) {
                day = new Date().toLocaleDateString();
                time = resp[0];
            } else if (resp[0].toLowerCase() === 'default') {
                isDefaultDateTime = true;
            } else if (resp[0].toLowerCase() === 'q') {
                await event.message.channel.send('*cancelled*');
                return;
            } else {
                await event.message.channel.send('cancelled: You must specify a time');
                return;
            }
        } else {
            day = resp[0];
        }
    }
    await new EmbedBuilderLocal()
        .setDescription('What is the description of the bid? [q=cancel]')
        .send(event.message.channel);
    const description = (await getUserResponse(event.message.channel, event.message.author.id))?.content;
    if (!description || description.toLowerCase() === 'q') {
        await event.message.channel.send('cancelled: You must specify a description');
        return;
    }
    let endDate;
    if (isDefaultDateTime) {
        endDate = BidEvent.defaultDateTime();
    } else {
        if (!day || !time) {
            await event.message.channel.send('You must specify a date and time');
            return;
        }
        endDate = new Date(day);
        const timeArr = time.split(':');
        if (timeArr.length < 2) {
            timeArr.push('00');
            timeArr.push('00');
        } else if (timeArr.length < 3) {
            timeArr.push('00');
        }
        endDate.setHours(Number(timeArr[0]), Number(timeArr[1]), Number(timeArr[2]));
        if (isNaN(endDate.getTime())) {
            await event.message.channel.send('Invalid date');
            return;
        }
        if (endDate.getTime() <= new Date().getTime()) {
            await event.message.channel.send('Date must be in the future');
            return;
        }
    }
    if (bidEvent) {
        bidEvent.reset();
        bidEvent.setDescription(description);
        bidEvent.setEndDateTime(endDate);
    } else {
        bidEvent = new BidEvent(<TextChannel>event.message.channel, description);
        bidEvent.setEndDateTime(endDate);
        bidManager.addBidEvent(event.message.channel.id, bidEvent);
    }
    await bidEvent.startBidding();
};
