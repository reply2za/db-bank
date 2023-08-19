import { commandHandler } from '../../../handlers/CommandHandler';
import { EventDataNames, MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { MonetaryTransfer } from '../../../finance/Transfer/MonetaryTransfer';

exports.run = async (event: MessageEventLocal) => {
    if (event.args[0]?.toLowerCase() === 'iou') {
        await commandHandler.execute({ ...event, statement: 'transferiou', args: event.args.slice(1) });
    } else {
        event.data.set(EventDataNames.AUTHOR_INTERACT_HISTORY, event.bankUser.getHistory());
        let recipientBankUser = await MonetaryTransfer.getUserToTransferTo(
            event.message,
            event.args.join(' '),
            event.data
        );
        if (!recipientBankUser) return;
        await new MonetaryTransfer(
            <TextChannel>event.message.channel,
            event.bankUser,
            recipientBankUser
        ).processTransfer();
    }
};
