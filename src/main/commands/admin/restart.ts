import { MessageEventLocal } from '../../utils/types';
import { execSync } from 'child_process';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    console.log('restarting...');
    await (<TextChannel>event.channel).send('restarting (may only shut down)...');
    try {
        execSync('pm2 restart db-bank');
    } catch (e) {}
    setTimeout(() => {
        process.exit(0);
    }, 10_000);
};
