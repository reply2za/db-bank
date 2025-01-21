import { execSync } from 'child_process';
import { MessageEventLocal } from '../../utils/types';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    console.log('shutting down...');
    await (<TextChannel>event.channel).send('shutting down...');
    try {
        execSync('pm2 delete db-bank');
    } catch (e) {}
    process.exit(0);
};
