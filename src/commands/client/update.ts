import { execSync } from 'child_process';
import { ADMIN_IDS } from '../../utils/constants';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    if (!ADMIN_IDS.includes(`${event.message.author.id} `)) return;
    await event.message.channel.send('updating....');
    execSync('git stash && git pull && pm2 delete db-bank || npm run pm2');
};
