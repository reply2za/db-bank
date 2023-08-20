import { MessageEventLocal } from '../../utils/types';
import { execSync } from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    console.log('restarting...');
    await event.message.channel.send('restarting (may only shut down)...');
    try {
        execSync('pm2 restart db-bank');
    } catch (e) {}
    setTimeout(() => {
        process.exit(0);
    }, 10_000);
};
