import { getUserResponse, getUserToTransferTo, roundNumberTwoDecimals } from '../../../utils/utils';
import { MessageEventLocal } from '../../../utils/types';
import { GuildTextBasedChannel, If, TextBasedChannel } from 'discord.js';
import { BankUser } from '../../../finance/BankUser';
import { BankVisualizer } from '../../../finance/BankVisualizer';
import { getAmount, validateAmount } from '../../../utils/numberUtils';
import { bank } from '../../../finance/Bank';
import { localStorage } from '../../../storage/LocalStorage';
import Logger from '../../../utils/Logger';

exports.run = async (event: MessageEventLocal) => {
    const recipientBankUser = await getUserToTransferTo(event.message, event.args[1]);
    if (!recipientBankUser) return;
    await processIOUTransfer(event.message.channel, event.bankUser, recipientBankUser);
};

/**
 * Performs the process of an IOU transfer.
 * @param channel The text channel to use.
 * @param sender The BankUser sending the IOU
 * @param receiver The BankUser receiving the IOU
 */
async function processIOUTransfer(
    channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>,
    sender: BankUser,
    receiver: BankUser
) {
    let transferEmbed = BankVisualizer.getIOUTransferEmbed(sender, receiver, 0);
    const embedMsg = await transferEmbed.send(channel);
    const responseAmt = await getAmount(channel, sender.userId);
    if (responseAmt === 'q') {
        channel.send('*cancelled transfer*');
        embedMsg.deletable && embedMsg.delete();
        return;
    }
    const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
    const isValid = validateAmount(transferAmount, channel);
    if (!isValid) {
        embedMsg.deletable && embedMsg.delete();
        return;
    }
    transferEmbed = BankVisualizer.getIOUTransferEmbed(sender, receiver, transferAmount);
    await transferEmbed.edit(embedMsg);
    channel.send('type a short reason/comment for the IOU: ');
    const comment = (await getUserResponse(channel, sender.userId))?.content || '';
    transferEmbed = BankVisualizer.getIOUTransferEmbed(sender, receiver, transferAmount, comment);
    await transferEmbed.edit(embedMsg);
    await BankVisualizer.getConfirmationEmbed('transfer').send(channel);
    const responseConfirmation = (await getUserResponse(channel, sender.userId))?.content;
    if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
        const transferResponse = bank.transferIOU(sender, receiver, transferAmount, comment);
        if (transferResponse.success) {
            await localStorage.saveData(bank.serializeData());
            await receiver.getDiscordUser().send({
                embeds: [
                    BankVisualizer.getIOUTransferNotificationEmbed(
                        sender.name,
                        receiver,
                        transferAmount,
                        comment
                    ).build(),
                ],
            });
            await Logger.transactionLog(
                `[IOU transfer] ${transferAmount} from ${sender.name} to ${receiver.name}\n` +
                    `comment: ${comment || 'N/A'}`
            );
            await BankVisualizer.getIOUTransferReceiptEmbed(receiver.name, transferAmount).send(channel);
        } else {
            await BankVisualizer.getErrorEmbed(
                `transfer failed: ${transferResponse.failReason || 'unknown reason'}`
            ).send(channel);
        }
    } else {
        channel.send('*cancelled transfer*');
    }
}
