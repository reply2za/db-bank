import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { MonetaryTransfer } from '../../../finance/Transfer/MonetaryTransfer';
import { transferFactory } from '../../../factories/TransferFactory';

const initiateTransferRequest = transferFactory.add(MonetaryTransfer, async (event, otherUser) => {
    await new MonetaryTransfer(<TextChannel>event.message.channel, event.bankUser, otherUser).processTransfer();
});

exports.run = async (event: MessageEventLocal) => {
    if (event.args[0]?.toLowerCase() === 'iou') {
        await commandHandler.execute({ ...event, statement: 'transferiou', args: event.args.slice(1) });
    } else {
        await initiateTransferRequest(event);
    }
};
