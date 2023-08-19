import { MessageEventLocal } from '../../utils/types';
import { TextChannel } from 'discord.js';
import { ChargeTransfer } from '../../finance/Transfer/ChargeTransfer';

exports.run = async (event: MessageEventLocal) => {
    await ChargeTransfer.printUserHistory(event.message, event.bankUser.getHistory());
    const sender = await ChargeTransfer.getUserToTransferTo(event.message, event.args.join(' '), event.data);
    if (!sender) return;
    await new ChargeTransfer(<TextChannel>event.message.channel, sender, event.bankUser).processTransfer();
};
