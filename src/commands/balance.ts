import { BankVisualizer } from '../finance/BankVisualizer';
import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    await BankVisualizer.showBalance(message.channel, bankUser);
};
