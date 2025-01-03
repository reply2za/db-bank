import { MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { IOUTransfer } from '../../../finance/Transfer/IOUTransfer';
import { TransferFactory } from '../../../factories/TransferFactory';

const initiateTransferRequest = TransferFactory.get(IOUTransfer, (event, otherUser) => {
    return new IOUTransfer(<TextChannel>event.message.channel, event.bankUser, otherUser);
});

exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};
