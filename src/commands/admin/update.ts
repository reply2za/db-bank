import { MessageEventLocal } from '../../utils/types';
import { execSync } from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    await event.message.channel.send('updating...');
    execSync('git stash && git pull && npm i && tsc && pm2 restart db-bank');
};
