import { IOUTicket } from '../IOUTicket';
import images from '../../utils/constants/images';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';

export default {
    /**
     * Shows redeemable IOUs.
     * @param ious A list of IOUs that are redeemable.
     * @param highlight Optional - An index, starting from 0, of the IOU to emphasis for redemption.
     */
    getRedeemableIOUEmbed(ious: IOUTicket[], highlight?: number): EmbedBuilderLocal {
        let descriptionText = '';
        let i = 1;
        if (highlight !== undefined) highlight++;
        for (const singleIOU of ious) {
            const iouDescription = getIOUDescription(
                i,
                singleIOU.sender.name,
                singleIOU.comment,
                singleIOU.quantity,
                singleIOU.expirationDate
            );
            if (i === highlight) {
                descriptionText += `[${iouDescription}]`;
            } else {
                descriptionText += iouDescription;
            }
            descriptionText += '\n';
            i++;
        }
        return new EmbedBuilderLocal()
            .setTitle(`Your redeemable IOU tickets`)
            .setDescription(descriptionText)
            .setColor('Blue')
            .setThumbnail(images.REDEEM_IOU_IMG);
    },
    /**
     * Shows sent IOUs.
     * @param ious A list of IOUs that were sent by an author.
     */
    getSentIOUEmbed(ious: IOUTicket[]) {
        let descriptionText = '';
        let i = 1;
        let total = 0;
        for (const singleIOU of ious) {
            let now = Date.now();
            let expDate = Date.parse(singleIOU.expirationDate);
            if (expDate && expDate < now) continue;
            total += singleIOU.quantity;
            descriptionText += getIOUDescription(
                i,
                singleIOU.receiver.name,
                singleIOU.comment,
                singleIOU.quantity,
                singleIOU.expirationDate
            );
            descriptionText += '\n';
            i++;
        }
        return new EmbedBuilderLocal()
            .setTitle(`You've sent ${total} IOUs`)
            .setDescription(descriptionText)
            .setColor('Fuchsia')
            .setThumbnail(images.SENT_IOU_IMG);
    },
    /**
     * Informs the author that redeemed the IOU that the redemption is complete.
     * @param origIOUSender The name of the author that originally sent the IOU.
     * @param quantity The number of IOUs being redeemed.
     */
    iouRedemptionReceipt(origIOUSender: string, quantity: number) {
        return new EmbedBuilderLocal()
            .setDescription(`redeemed ${quantity > 1 ? `${quantity} IOUs` : 'IOU'} with ${origIOUSender}!`)
            .setColor('Blue');
    },
    /**
     * Notifies the original IOU sender that their IOU has been redeemed.
     * @param iouRecipientName The name author that redeemed the IOU.
     * @param iouComment The reason for the IOU.
     * @param quantity The number of IOUs that are being redeemed.
     * @param redemptionComment Optional - The reason/comment for the redemption.
     */
    iouRedeemedNotifEmbed(iouRecipientName: string, iouComment = '', quantity: number, redemptionComment?: string) {
        let title;
        let description;
        if (quantity > 1) {
            title = `${iouRecipientName} redeemed ${quantity} IOUs`;
            description = `${quantity} IOUs that you gave to ${iouRecipientName} have been redeemed.\nCongratulations!`;
        } else {
            title = `${iouRecipientName} redeemed an IOU`;
            description = `An IOU that you gave to ${iouRecipientName} has been redeemed.\nCongratulations!`;
        }
        if (redemptionComment) description += `\n**Redemption comment:** ${redemptionComment}`;
        return new EmbedBuilderLocal()
            .setTitle(title)
            .setColor('Aqua')
            .setThumbnail(images.REDEEMED_IOU_NOTIF_IMG)
            .setDescription(description)
            .setFooter(`Original IOU reason: ${iouComment || 'unnamed'}`);
    },
};

function getIOUDescription(num: number, name: string, comment: string, quantity: number, expDate: string) {
    return `${num}. **${name}**${quantity > 1 ? ` [x${quantity}]` : ''} (exp ${expDate}): ${comment.substring(0, 50)}`;
}
