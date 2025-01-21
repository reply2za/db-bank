import { MessageEventLocal } from '../../../utils/types';
import { SlashCommandBuilder, TextChannel } from 'discord.js';
import { IOUTransfer } from '../../../finance/Transfer/IOUTransfer';
import { TransferFactory } from '../../../factories/TransferFactory';
import path from 'node:path';

const initiateTransferRequest = TransferFactory.get(IOUTransfer, (event, otherUser) => {
    return new IOUTransfer(<TextChannel>event.channel, event.bankUser, otherUser);
});

exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName(path.basename(__filename).split('.')[0])
        .setDescription('Send IOUs to a user'),
    run: exports.run,
};
