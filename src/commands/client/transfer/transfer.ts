import { getUserResponse, getUserToTransferTo, roundNumberTwoDecimals } from '../../../utils/utils';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { TextBasedChannel } from 'discord.js';
import { BankUser } from '../../../finance/BankUser';
import { BankVisualizer } from '../../../finance/BankVisualizer';
import { getAmount, validateMonetaryAmount } from '../../../utils/numberUtils';
import { bank } from '../../../finance/Bank';
import { TransferType } from '../../../finance/types';

exports.run = async (event: MessageEventLocal) => {
    if (event.args[1]?.toLowerCase() === 'iou') {
        event.args = [event.args[0]];
        commandHandler.execute({ ...event, statement: 'transferiou' });
    } else {
        const recipientBankUser = await getUserToTransferTo(event.message, event.args[1]);
        if (!recipientBankUser) return;
        await processMonetaryTransfer(event.message.channel, event.bankUser, recipientBankUser);
    }
};

/**
 * Performs the process of a monetary transfer.
 * @param channel The text channel to use.
 * @param sender The BankUser sending the money.
 * @param receiver The BankUser receiving the money.
 */
async function processMonetaryTransfer(channel: TextBasedChannel, sender: BankUser, receiver: BankUser) {
    let transferEmbed = BankVisualizer.getCashTransferEmbed(sender, receiver, 0);
    const embedMsg = await transferEmbed.send(channel);
    const responseAmt = await getAmount(channel, sender.userId);
    if (responseAmt === 'q') {
        channel.send('*cancelled transfer*');
        embedMsg.deletable && embedMsg.delete();
        return;
    }
    const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
    const isValid = validateMonetaryAmount(transferAmount, sender, channel);
    if (!isValid) {
        embedMsg.deletable && embedMsg.delete();
        return;
    }
    transferEmbed = BankVisualizer.getCashTransferEmbed(sender, receiver, transferAmount);
    await transferEmbed.edit(embedMsg);
    await BankVisualizer.getConfirmationEmbed('transfer').send(channel);
    const responseConfirmation = (await getUserResponse(channel, sender.userId))?.content;
    if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
        await bank.transferAmount(sender, receiver, transferAmount, channel, TransferType.TRANSFER);
    } else {
        await channel.send('*cancelled transfer*');
    }
}
