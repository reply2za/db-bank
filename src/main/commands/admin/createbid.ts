import { MessageEventLocal } from '../../utils/types';
import { bidManager } from '../../finance/bid/BidManager';
import { BidEvent } from '../../finance/bid/BidEvent';
import { TextChannel } from 'discord.js';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { getUserResponse } from '../../utils/utils';
import moment from 'moment';

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
            day = BidEvent.getCurrentMoment().format('L');
            time = event.args[0];
        }
        if (event.args[1] && event.args[1].includes(':')) {
            time = event.args[1];
        }
    } else {
        await new EmbedBuilderLocal()
            .setDescription("What is the date and time of the bid? (YYYYMMDD HH:MM:SS) or 'default' [q=cancel]")
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
            time = resp[1];
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
            await event.message.channel.send('You must specify a date and time ' + day + "|" + time);
            return;
        }
        endDate = moment(day);
        const timeArr = time.split(':');
        if (timeArr.length < 2) {
            timeArr.push('00');
            timeArr.push('00');
        } else if (timeArr.length < 3) {
            timeArr.push('00');
        }
        endDate.set({
            hour: parseInt(timeArr[0]),
            minute: parseInt(timeArr[1]),
            second: parseInt(timeArr[2])
        });
        if (isNaN(endDate.valueOf())) {
            await event.message.channel.send('Invalid date');
            return;
        }
        if (endDate.isBefore(BidEvent.getCurrentMoment())) {
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
