import { MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { IOUTransfer } from '../../../finance/Transfer/IOUTransfer';
import { transferFactory } from '../../../factories/TransferFactory';

const initiateTransferRequest = transferFactory.add(IOUTransfer, async (event, otherUser) => {
    await new IOUTransfer(<TextChannel>event.message.channel, event.bankUser, otherUser).processTransfer();
});
exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};

export default exports;
