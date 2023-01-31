import { TransferManager } from '../../finance/TransferManager';
import { getUserToTransferTo } from '../../utils/utils';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    const recipientBankUser = await getUserToTransferTo(event.message, event.args[1]);
    if (!recipientBankUser) return;
    await new TransferManager(event.bankUser).processIOUTransfer(event.message.channel, recipientBankUser);
};
