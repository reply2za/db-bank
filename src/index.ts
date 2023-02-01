'use strict';
import { TextChannel } from 'discord.js';
import { bot, isDevMode } from './utils/constants';
import { bank } from './finance/Bank';
import { localStorage } from './Storage/LocalStorage';
import { commandHandler } from './handlers/CommandHandler';
import { eventHandler } from './handlers/EventHandler';

require('dotenv').config();

const token = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');

process.on('uncaughtException', (error) => {
    console.log(error);
    bot.channels.fetch('1064628593772220488').then((channel) => {
        error.stack && (<TextChannel>channel)?.send(error.stack);
    });
});

(async () => {
    if (isDevMode) console.log('-devMode-');
    await bot.login(token);
    console.log('-logged in-');
    console.log('loading data...');
    const data = await localStorage.retrieveData();
    if (data) {
        await bank.deserializeAndLoadData(data, bot.users);
        console.log('-data loaded-');
    } else {
        console.log('[WARN] No local data!');
    }
    commandHandler.loadAllCommands();
    eventHandler.loadAllEvents();
})();
