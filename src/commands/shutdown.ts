import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { ADMIN_IDS } from '../utils/constants';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    if (!ADMIN_IDS.includes(`${message.author.id} `)) return;
    message.channel.send('shutting down...');
    process.exit(0);
};
