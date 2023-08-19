import { MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { IOUTransfer } from '../../../finance/Transfer/IOUTransfer';

exports.run = async (event: MessageEventLocal) => {
    let history = event.bankUser.getHistory();
    await IOUTransfer.printUserHistory(event.message, history);
    const recipientBankUser = await IOUTransfer.getUserToTransferTo(event.message, event.args.join(' '), event.data);
    if (!recipientBankUser) return;
    await new IOUTransfer(<TextChannel>event.message.channel, event.bankUser, recipientBankUser).processTransfer();
};

export default exports;
