import { getUserToTransferTo } from '../utils/utils';
import { TransferManager } from '../finance/TransferManager';
import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { clientCommands } from '../utils/constants';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    if (args[1]?.toLowerCase() === 'iou') {
        args = [args[0]];
        clientCommands.get('transferiou')?.run(statement, message, args, prefix, bankUser);
    } else {
        const recipientBankUser = await getUserToTransferTo(message, args[1]);
        if (!recipientBankUser) return;
        await new TransferManager(bankUser).processMonetaryTransfer(message.channel, recipientBankUser);
    }
};
