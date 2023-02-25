import { getUserToTransferTo } from '../../../utils/utils';
import { TransferManager } from '../../../finance/TransferManager';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    if (event.args[1]?.toLowerCase() === 'iou') {
        event.args = [event.args[0]];
        commandHandler.execute({ ...event, statement: 'transferiou' });
    } else {
        const recipientBankUser = await getUserToTransferTo(event.message, event.args[1]);
        if (!recipientBankUser) return;
        await new TransferManager(event.bankUser).processMonetaryTransfer(event.message.channel, recipientBankUser);
    }
};
