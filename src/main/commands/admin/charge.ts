import { MessageEventLocal } from '../../utils/types';
import { TextChannel } from 'discord.js';
import { ChargeTransfer } from '../../finance/Transfer/ChargeTransfer';
import { transferFactory } from '../../factories/TransferFactory';

const initiateTransferRequest = transferFactory.add(ChargeTransfer, async (event, otherUser) => {
    await new ChargeTransfer(<TextChannel>event.message.channel, otherUser, event.bankUser).processTransfer();
});
exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};
