import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { execSync } from 'child_process';
import { ADMIN_IDS } from '../utils/constants';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    if (!ADMIN_IDS.includes(`${message.author.id} `)) return;
    await message.channel.send('updating....');
    execSync('git stash && git pull && pm2 delete db-bank || npm run pm2');
};
