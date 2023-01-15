import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { TransferManager } from '../finance/TransferManager';
import { getUserToTransferTo } from '../utils/utils';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    const recipientBankUser = await getUserToTransferTo(message, args[1]);
    if (!recipientBankUser) return;
    await new TransferManager(bankUser).processIOUTransfer(message.channel, recipientBankUser);
};
