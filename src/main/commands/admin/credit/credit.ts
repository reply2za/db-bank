import { MessageEventLocal } from '../../../utils/types';
import { TransferFactory } from '../../../factories/TransferFactory';
import { CreditTransfer } from '../../../finance/Transfer/CreditTransfer';
import { TextChannel } from 'discord.js';

const initiateTransferRequest = TransferFactory.get(CreditTransfer, (event, otherUser) => {
    return new CreditTransfer(<TextChannel>event.channel, event.bankUser, otherUser);
});

exports.run = async (event: MessageEventLocal): Promise<void> => {
    await initiateTransferRequest(event);
};
