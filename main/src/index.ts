'use strict';
// dotenv should be the first thing imported
require('dotenv').config();
import { bot, config } from './utils/constants/constants';
import { bank } from './finance/Bank';
import { localStorage } from './storage/LocalStorage';
import { commandHandler } from './handlers/CommandHandler';
import { eventHandler } from './handlers/EventHandler';
import Logger from './utils/Logger';
import { processManager } from './utils/ProcessManager';

process.on('uncaughtException', async (error) => {
    await processManager.handleErrors(error, '[uncaughtException]');
});

async function main() {
    const loggedIn = await processManager.login();
    if (!loggedIn) {
        console.log('[ERROR] failed to login');
        process.exit(1);
    }
    if (config.isDevMode) {
        console.log('-devMode-');
    } else {
        console.log('-PROD-');
        await Logger.infoLog(
            `starting ${process.pid} [${config.hardwareTag}]: v${processManager.version} (${config.prefix})`
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
    console.log(`prefix: ${config.prefix}`);
}

main().finally(() => {
    // fetch a channel every 2 hours to check the process's connection
    const FETCH_INTERVAL = 1000 * 60 * 60 * 2;
    setInterval(() => {
        if (processManager.isLoggedIn()) bot.channels.fetch(config.infoLogChID, { force: true }).then();
    }, FETCH_INTERVAL);
});
