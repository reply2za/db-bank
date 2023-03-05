'use strict';
require('dotenv').config();
const token = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');
const hardwareTag = process.env.HARDWARE_TAG?.replace(/\\n/gm, '\n');
import { bot, isDevMode, PREFIX } from './utils/constants/constants';
import { bank } from './finance/Bank';
import { localStorage } from './storage/LocalStorage';
import { commandHandler } from './handlers/CommandHandler';
import { eventHandler } from './handlers/EventHandler';
import Logger from './utils/Logger';
import { processManager } from './utils/ProcessManager';

(async () => {
    await bot.login(token);
    console.log('-logged in-');
    process.on('uncaughtException', (error) => {
        Logger.errorLog(error);
    });
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
    console.log(`prefix is: ${PREFIX}`);
})();
