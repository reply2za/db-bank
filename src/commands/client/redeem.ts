import { bank } from '../../finance/Bank';
import iouVisualizer from '../../finance/visualizers/iouVisualizer';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { getUserResponse } from '../../utils/utils';
import { bot } from '../../utils/constants/constants';
import { EventDataNames, MessageEventLocal } from '../../utils/types';
import Logger from '../../utils/Logger';
import visualizerCommon from '../../finance/visualizers/visualizerCommon';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserIOUs(event.bankUser.getUserId());
    if (ious.length < 1) {
        event.message.channel.send('*no redeemable IOUs found*');
        return;
    }
    const sentIOUEmbed =
        event.data.get(EventDataNames.REDEEM_IOU_EMBED_MSG) ||
        (await iouVisualizer.getRedeemableIOUEmbed(ious).send(event.message.channel));
    await new EmbedBuilderLocal()
        .setDescription("which IOU would you like to redeem [or 'q' to quit]")
        .send(event.message.channel);
    const iouIndexResponse = (await getUserResponse(event.message.channel, event.bankUser.getUserId()))?.content;
    if (!iouIndexResponse || iouIndexResponse.toLowerCase() === 'q') {
        event.message.channel.send('*cancelled*');
        return;
    }
    const iouIndex = Math.floor(Number(iouIndexResponse)) - 1;
    if (!Number.isFinite(iouIndex) || !ious[iouIndex]) {
        event.message.channel.send('*cancelled: invalid input*');
        return;
    }
    await iouVisualizer.getRedeemableIOUEmbed(ious, iouIndex).edit(sentIOUEmbed);
    const iou = ious[iouIndex];
    await visualizerCommon.getConfirmationEmbed('redemption').send(event.message.channel);
    const response = (await getUserResponse(event.message.channel, event.bankUser.getUserId()))?.content;
    if (response?.toLowerCase() === 'yes') {
        const isSuccessful = await bank.redeemIOU(iou.id);
        if (isSuccessful) {
            const iouSender = await bot.users.fetch(iou.sender.id);
            await iouVisualizer.iouRedemptionReceipt(iou.sender.name).send(event.message.channel);
            if (iouSender) {
                const iouRedeemedNotifEmbed = iouVisualizer.iouRedeemedNotifEmbed(iou.receiver.name, iou.comment);
                await iouSender.send({
                    embeds: [iouRedeemedNotifEmbed.build()],
                });
                await Logger.transactionLog(
                    `[iou redemption] ${iou.receiver.name} redeemed an IOU from ${iou.sender.name} \n` +
                        `IOU reason: ${iou.comment || 'N/A'}`
                );
            } else {
                Logger.errorLog(new Error(`could not find iou sender with the id ${iou.sender.id}`));
            }
        }
    } else {
        event.message.channel.send('*cancelled*');
    }
};
