import { bank } from '../../../finance/Bank';
import iouVisualizer from '../../../finance/visualizers/iouVisualizer';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { formatErrorText, getUserResponse } from '../../../utils/utils';
import { bot } from '../../../utils/constants/constants';
import { EventDataNames, MessageEventLocal } from '../../../utils/types';
import Logger from '../../../utils/Logger';
import visualizerCommon from '../../../finance/visualizers/visualizerCommon';
import { Colors, TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserIOUs(event.bankUser.getUserId());
    if (ious.length < 1) {
        await (<TextChannel>event.message.channel).send('*no redeemable IOUs found*');
        return;
    }
    const sentIOUEmbed =
        event.data.get(EventDataNames.REDEEM_IOU_EMBED_MSG) ||
        (await iouVisualizer.getRedeemableIOUEmbed(ious).send(event.message.channel));
    let maxRetries = 3;
    let quantity;
    let iou;
    do {
        maxRetries--;
        if (maxRetries < 0) {
            await (<TextChannel>event.message.channel).send('*cancelled redeem request*');
            return;
        }
        if (!iou) {
            await new EmbedBuilderLocal()
                .setDescription("which IOU would you like to redeem [or 'q' to quit]")
                .send(event.message.channel);
            const iouIndexResponse = (await getUserResponse(event.message.channel, event.bankUser.getUserId()))
                ?.content;
            if (!iouIndexResponse || iouIndexResponse.toLowerCase() === 'q') {
                (<TextChannel>event.message.channel).send('*cancelled*');
                return;
            }
            const iouIndex = Math.floor(Number(iouIndexResponse)) - 1;
            if (!Number.isFinite(iouIndex) || !ious[iouIndex]) {
                (<TextChannel>event.message.channel).send(formatErrorText('invalid IOU number'));
                continue;
            }
            await iouVisualizer.getRedeemableIOUEmbed(ious, iouIndex).edit(sentIOUEmbed);
            iou = ious[iouIndex];
        }
        // the number of IOUs to redeem
        quantity = 1;
        if (iou.quantity > 1) {
            quantity = await getIOURedeemQty(
                <TextChannel>event.message.channel,
                iou.quantity,
                event.bankUser.getUserId()
            );
        }
        if (quantity === undefined) return;
    } while (!quantity || quantity < 1);
    if (!iou) {
        (<TextChannel>event.message.channel).send(formatErrorText('could not find IOU'));
        return;
    }
    await new EmbedBuilderLocal()
        .setColor(Colors.Orange)
        .setDescription("why are you redeeming this IOU ? ['b' = blank, 'q' = cancel]")
        .send(event.message.channel);

    const reasonRsp = (await getUserResponse(event.message.channel, event.bankUser.getUserId()))?.content;
    if (!reasonRsp || reasonRsp.toLowerCase() === 'q') {
        (<TextChannel>event.message.channel).send('*cancelled*');
        return;
    }
    let redemptionComment = reasonRsp;
    if (reasonRsp.toLowerCase() === 'b') {
        redemptionComment = '';
    }
    // whether to append an s to text based on the IOU quantity
    const appendS = quantity > 1 ? 's' : '';
    await visualizerCommon
        .getConfirmationEmbed(`redemption of ${quantity} IOU${appendS}`)
        .addFields(
            { name: 'to', value: `${iou.sender.name}`, inline: true },
            { name: 'comment', value: redemptionComment || '*(empty)*', inline: true }
        )
        .send(event.message.channel);
    const response = (await getUserResponse(event.message.channel, event.bankUser.getUserId()))?.content;
    if (response?.toLowerCase() === 'yes') {
        const isSuccessful = await bank.redeemIOU(iou.id, quantity);
        if (isSuccessful) {
            const iouSender = await bot.users.fetch(iou.sender.id);
            await iouVisualizer.iouRedemptionReceipt(iou.sender.name, quantity).send(event.message.channel);
            if (iouSender) {
                const iouRedeemedNotifEmbed = iouVisualizer.iouRedeemedNotifEmbed(
                    iou.receiver.name,
                    iou.comment,
                    quantity,
                    redemptionComment
                );
                await iouSender.send({
                    embeds: [iouRedeemedNotifEmbed.build()],
                });
                const senderName = bank.getUserCopy(iou.sender.id)?.getDBName() || iou.sender.name;
                const receiverName = bank.getUserCopy(iou.receiver.id)?.getDBName() || iou.receiver.name;
                await Logger.transactionLog(
                    `[iou redemption] (${iou.sender.id} -> ${iou.receiver.id})\n` +
                        `${receiverName} redeemed ${quantity} IOU${appendS} from ${senderName} \n` +
                        `IOU reason: ${iou.comment || 'N/A'}\n` +
                        `Redemption reason: ${redemptionComment || 'N/A'}\n` +
                        `----------------------------------------`
                );
            } else {
                await Logger.errorLog(new Error(`could not find iou sender with the id ${iou.sender.id}`));
            }
        } else {
            await (<TextChannel>event.message.channel).send(formatErrorText('could not complete redemption'));
        }
    } else {
        await (<TextChannel>event.message.channel).send('*cancelled*');
    }
};

/**
 * Asks the author once for the number of IOUs to redeem.
 * Informs the user if the value is invalid or if flow is cancelled.
 * @param channel The channel to prompt the author in.
 * @param qty The available IOU quantity.
 * @param userId The id of the author to ask.
 * @returns The number of IOUs to redeem, or -1 if unsuccessful. Returns undefined if user cancelled or abandoned.
 */
async function getIOURedeemQty(channel: TextChannel, qty: number, userId: string): Promise<number | undefined> {
    let quantity;
    await channel.send(`*There are ${qty} of these IOUs, how many would you like to redeem? ['q'=cancel]*`);
    const response = (await getUserResponse(channel, userId))?.content;
    if (!response) {
        await channel.send('*cancelled: no response provided*');
        return undefined;
    }
    if (response === 'q') {
        await channel.send('*cancelled*');
        return undefined;
    }
    quantity = parseInt(response);
    if (!quantity || quantity < 1) {
        await channel.send(formatErrorText('invalid response'));
        return -1;
    }
    if (quantity > qty) {
        await channel.send(formatErrorText('given value is greater than the IOU quantity'));
        return -1;
    }
    return quantity;
}
