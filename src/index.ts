'use strict';
import { TextChannel } from 'discord.js';
import { bot } from './utils/constants';
import { bank } from './finance/Bank';
import { localStorage } from './Storage/LocalStorage';
import fs from 'fs';
import { commandHandler } from './handlers/CommandHandler';

require('dotenv').config();

const token = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');

function listenForMessages() {
    commandHandler.loadAllCommands();
    const files = fs.readdirSync('./dist/events').filter((file) => file.endsWith('.js'));
    for (const file of files) {
        const eventName = file.split('.')[0];
        const event = require(`./events/${file}`);
        bot.on(eventName, event);
    }
    console.log('-loaded events-');
}

async function loadData() {
    const data = await localStorage.retrieveData();
    if (data) {
        await bank.deserializeAndLoadData(data, bot.users);
    } else {
        console.log('[WARN] No local data!');
    }
}

process.on('uncaughtException', (error) => {
    console.log(error);
    bot.channels.fetch('1064628593772220488').then((channel) => {
        error.stack && (<TextChannel>channel)?.send(error.stack);
    });
});

(async () => {
    await bot.login(token);
    console.log('-logged in-');
    console.log('loading data...');
    await loadData();
    console.log('-data loaded-');
    listenForMessages();
})();
