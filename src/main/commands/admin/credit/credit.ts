import { MessageEventLocal } from '../../../utils/types';
import { transferFactory } from '../../../factories/TransferFactory';
import { CreditTransfer } from '../../../finance/Transfer/CreditTransfer';
import { TextChannel } from 'discord.js';

const initiateTransferRequest = transferFactory.add(CreditTransfer, async (event, otherUser) => {
    await new CreditTransfer(<TextChannel>event.message.channel, event.bankUser, otherUser).processTransfer();
});

exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};
