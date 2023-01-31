import { execSync } from 'child_process';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    console.log('shutting down...');
    event.message.channel.send('shutting down...');
    try {
        execSync('pm2 delete db-bank');
    } catch (e) {}
    process.exit(0);
};
