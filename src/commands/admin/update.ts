import { MessageEventLocal } from '../../utils/types';
import { execSync } from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    event.message.channel.send('updating...');
    execSync('git stash && git pull && npm i && pm2 restart db-bank');
};
