import { bank } from '../../finance/Bank';
import { BankVisualizer } from '../../finance/BankVisualizer';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { getUserResponse } from '../../utils/utils';
import { bot } from '../../utils/constants/constants';
import { MessageEventLocal } from '../../utils/types';
import { REDEEMED_IOU_NOTIF_IMG } from '../../utils/constants/images';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserIOUs(event.bankUser.userId);
    if (ious.length < 1) {
        event.message.channel.send('*no redeemable IOUs found*');
        return;
    }
    const sentIOUEmbed =
        event.data.get('REDEEM_IOU_EMBED_MSG') ||
        (await BankVisualizer.getRedeemableIOUEmbed(ious).send(event.message.channel));
    await new EmbedBuilderLocal()
        .setDescription("which IOU would you like to redeem [or 'q' to quit]")
        .send(event.message.channel);
    const iouIndexResponse = (await getUserResponse(event.message.channel, event.bankUser.userId))?.content;
    if (!iouIndexResponse || iouIndexResponse.toLowerCase() === 'q') {
        event.message.channel.send('*cancelled*');
        return;
    }
    const iouIndex = Math.floor(Number(iouIndexResponse)) - 1;
    if (!Number.isFinite(iouIndex) || !ious[iouIndex]) {
        event.message.channel.send('*invalid input*');
        return;
    }
    await BankVisualizer.getRedeemableIOUEmbed(ious, iouIndex).edit(sentIOUEmbed);
    const iou = ious[iouIndex];
    await BankVisualizer.getConfirmationEmbed('redemption').send(event.message.channel);
    const response = (await getUserResponse(event.message.channel, event.bankUser.userId))?.content;
    if (response?.toLowerCase() === 'yes') {
        const isSuccessful = await bank.redeemIOU(iou.id);
        if (isSuccessful) {
            const iouSender = await bot.users.fetch(iou.sender.id);
            await new EmbedBuilderLocal()
                .setDescription(`redeemed IOU with ${iou.sender.name}!`)
                .setColor('Blue')
                .send(event.message.channel);
            if (iouSender) {
                const iouRedeemedNotifEmbed = new EmbedBuilderLocal()
                    .setTitle(`${event.bankUser.name} redeemed your IOU`)
                    .setColor('Aqua')
                    .setThumbnail(REDEEMED_IOU_NOTIF_IMG)
                    .setDescription(`The IOU you gave to ${event.bankUser.name} has been redeemed\nCongratulations!`)
                    .setFooter(`IOU reason: ${iou.comment || 'none'}`);
                await iouSender.send({
                    embeds: [iouRedeemedNotifEmbed.build()],
                });
            }
        }
    } else {
        event.message.channel.send('*cancelled*');
    }
};
