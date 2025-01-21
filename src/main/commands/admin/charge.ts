import { MessageEventLocal } from '../../utils/types';
import { ChargeTransfer } from '../../finance/Transfer/ChargeTransfer';
import { TransferFactory } from '../../factories/TransferFactory';

const initiateTransferRequest = TransferFactory.get(ChargeTransfer, (event, otherUser) => {
    return new ChargeTransfer(event.channel, otherUser, event.bankUser);
});

exports.run = async (event: MessageEventLocal) => {
    await initiateTransferRequest(event);
};
