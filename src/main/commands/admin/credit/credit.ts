import { EventDataNames, MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { CreditTransfer } from '../../../finance/Transfer/CreditTransfer';

exports.run = async (event: MessageEventLocal) => {
    event.data.set(EventDataNames.AUTHOR_INTERACT_HISTORY, event.bankUser.getHistory());
    const receiver = await CreditTransfer.getUserToTransferTo(event.message, event.args.join(' '), event.data);
    if (!receiver) return;
    await new CreditTransfer(<TextChannel>event.message.channel, event.bankUser, receiver).processTransfer();
};
