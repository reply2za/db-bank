import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { bank } from '../finance/Bank';
import { BankVisualizer } from '../finance/BankVisualizer';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { getUserResponse } from '../utils/utils';
import { bot, REDEEMED_IOU_NOTIF_IMG } from '../utils/constants';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    const ious = bank.getUserIOUs(bankUser.userId);
    if (ious.length < 1) {
        message.channel.send('*no redeemable IOUs found*');
        return;
    }
    const sentIOUEmbed = await BankVisualizer.getRedeemableIOUEmbed(ious).send(message.channel);
    await new EmbedBuilderLocal()
        .setDescription("which IOU would you like to redeem [or 'q' to quit]")
        .send(message.channel);
    const iouIndexResponse = (await getUserResponse(message.channel, bankUser.userId))?.content;
    if (iouIndexResponse && iouIndexResponse.toLowerCase() === 'q') {
        message.channel.send('**cancelled**');
        return;
    }
    const iouIndex = Math.floor(Number(iouIndexResponse)) - 1;
    if (!Number.isFinite(iouIndex) || !ious[iouIndex]) {
        message.channel.send('*invalid input*');
        return;
    }
    await BankVisualizer.getRedeemableIOUEmbed(ious, iouIndex).edit(sentIOUEmbed);
    const iou = ious[iouIndex];
    await BankVisualizer.getPreTransferConfirmationEmbed().send(message.channel);
    const response = (await getUserResponse(message.channel, bankUser.userId))?.content;
    if (response?.toLowerCase() === 'yes') {
        const isSuccessful = await bank.redeemIOU(iou.id);
        if (isSuccessful) {
            const iouSender = await bot.users.fetch(iou.sender.id);
            await new EmbedBuilderLocal()
                .setDescription(`redeemed IOU with ${iou.sender.name}!`)
                .setColor('Blue')
                .send(message.channel);
            if (iouSender) {
                const iouRedeemedNotifEmbed = new EmbedBuilderLocal()
                    .setTitle(`${bankUser.name} redeemed your IOU`)
                    .setColor('Aqua')
                    .setThumbnail(REDEEMED_IOU_NOTIF_IMG)
                    .setDescription(`The IOU you gave to ${bankUser.name} has been redeemed\nCongratulations!`);
                await iouSender.send({
                    embeds: [iouRedeemedNotifEmbed.build()],
                });
            }
        }
    } else {
        message.channel.send('*cancelled*');
    }
};
