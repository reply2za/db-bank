'use strict';
import { bot, isDevMode, PREFIX } from './utils/constants/constants';
import { bank } from './finance/Bank';
import { localStorage } from './storage/LocalStorage';
import { commandHandler } from './handlers/CommandHandler';
import { eventHandler } from './handlers/EventHandler';
import Logger from './utils/Logger';
import { processManager } from './utils/ProcessManager';
import { fixConnection } from './utils/utils';
require('dotenv').config();
const token = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');
const hardwareTag = process.env.HARDWARE_TAG?.replace(/\\n/gm, '\n');

if (!token) {
    throw new Error('missing params within .env');
}

let isLoggedIn = false;
let isFixingConnection = false;
process.on('uncaughtException', async (error) => {
    if (isLoggedIn) Logger.errorLog(error, '[UNCAUGHT EXCEPTION]');
    else console.log('[UNCAUGHT EXCEPTION]', error);
    if (error.message.includes('getaddrinfo ENOTFOUND discord.com')) {
        isFixingConnection = true;
        const wasSuccessful = await fixConnection(token);
        isFixingConnection = false;
        if (wasSuccessful && !isLoggedIn) main();
    } else if ('Error: Expected token to be set for this request, but none was present') {
        process.exit(1);
    }
});

async function main() {
    await bot.login(token);
    console.log('-logged in-');
    isLoggedIn = true;
    if (isDevMode) {
        console.log('-devMode-');
    } else {
        console.log('-PROD-');
        await Logger.infoLog(
            `starting ${process.pid} [${hardwareTag || 'unnamed'}]: v${processManager.version} (${PREFIX})`
        );
    }
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
}

main().then(() => {
    console.log(`prefix is ${PREFIX}`);
});
