import { MessageEventLocal } from '../../utils/types';
import { TextChannel } from 'discord.js';
import { ChargeTransfer } from '../../finance/Transfer/ChargeTransfer';
import { TransferFactory } from '../../factories/TransferFactory';

const initiateTransferRequest = TransferFactory.get(ChargeTransfer, (event, otherUser) => {
    return new ChargeTransfer(<TextChannel>event.message.channel, otherUser, event.bankUser);
});

exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};
