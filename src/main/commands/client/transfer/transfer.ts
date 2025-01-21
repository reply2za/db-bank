import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { SlashCommandBuilder, TextChannel } from 'discord.js';
import { MonetaryTransfer } from '../../../finance/Transfer/MonetaryTransfer';
import { TransferFactory } from '../../../factories/TransferFactory';
import path from 'node:path';

const initiateTransferRequest = TransferFactory.get(MonetaryTransfer, (event, otherUser) => {
    return new MonetaryTransfer(<TextChannel>event.channel, event.bankUser, otherUser);
});

exports.run = async (event: MessageEventLocal) => {
    if (event.args[0]?.toLowerCase() === 'iou') {
        await commandHandler.execute({ ...event, statement: 'transferiou', args: event.args.slice(1) });
    } else {
        await initiateTransferRequest(event);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName(path.basename(__filename).split('.')[0])
        .setDescription('Transfer money to a user'),
    run: exports.run,
};
