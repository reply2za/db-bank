import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';

const { version } = require('../../package.json');

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    await new EmbedBuilderLocal().setDescription(version).send(message.channel);
};
