import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { EmbedBuilderLocal } from '../utils/EmbedBuilderLocal';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    await new EmbedBuilderLocal()
        .setTitle('Help')
        .setDescription(
            `commands:
            **balance** - view balance
            **transfer** [name] - initiate transfer process
            **transferiou** - transfer an IOU
            **redeem** - redeem an IOU`
        )
        .build()
        // @ts-ignore
        .send(message.channel);
};
