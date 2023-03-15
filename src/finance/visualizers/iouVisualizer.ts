import { IOUTicket } from '../IOUTicket';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import images from '../../utils/constants/images';

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
        let selectedIOU;
        for (const singleIOU of ious) {
            const iouDescription = getIOUDescription(i, singleIOU.sender.name, singleIOU.comment, singleIOU.quantity);
            if (i === highlight) {
                descriptionText += `[${iouDescription}]`;
                selectedIOU = singleIOU;
            } else {
                descriptionText += iouDescription;
            }
            descriptionText += '\n';
            i++;
        }
        const embed = new EmbedBuilderLocal()
            .setTitle(`Your redeemable IOU tickets`)
            .setDescription(descriptionText)
            .setColor('Blue')
            .setThumbnail(images.REDEEM_IOU_IMG);
        if (selectedIOU && selectedIOU.quantity > 1) {
            embed.setFooter(`this will use 1 of your ${selectedIOU.quantity} IOUs in this pack`);
        }
        return embed;
    },
    /**
     * Shows sent IOUs.
     * @param ious A list of IOUs that were sent by a user.
     */
    getSentIOUEmbed(ious: IOUTicket[]) {
        let descriptionText = '';
        let i = 1;
        for (const singleIOU of ious) {
            descriptionText += getIOUDescription(i, singleIOU.receiver.name, singleIOU.comment, singleIOU.quantity);
            descriptionText += '\n';
            i++;
        }
        return new EmbedBuilderLocal()
            .setTitle(`Your sent IOUs to`)
            .setDescription(descriptionText)
            .setColor('Fuchsia')
            .setThumbnail(images.SENT_IOU_IMG);
    },
    /**
     * Informs the user that redeemed the IOU that the redemption is complete.
     * @param origIOUSender The name of the user that originally sent the IOU.
     */
    iouRedemptionReceipt(origIOUSender: string) {
        return new EmbedBuilderLocal().setDescription(`redeemed IOU with ${origIOUSender}!`).setColor('Blue');
    },
    /**
     * Notifies the original IOU sender that their IOU has been redeemed.
     * @param iouRecipientName The name user that redeemed the IOU.
     * @param iouComment The reason for the IOU.
     */
    iouRedeemedNotifEmbed(iouRecipientName: string, iouComment?: string) {
        return new EmbedBuilderLocal()
            .setTitle(`${iouRecipientName} redeemed your IOU`)
            .setColor('Aqua')
            .setThumbnail(images.REDEEMED_IOU_NOTIF_IMG)
            .setDescription(`The IOU you gave to ${iouRecipientName} has been redeemed\nCongratulations!`)
            .setFooter(`IOU reason: ${iouComment || 'none'}`);
    },
};

function getIOUDescription(num: number, name: string, comment: string, quantity: number) {
    return `${num}. **${name}**${quantity > 1 ? ` (x${quantity})` : ''}: ${comment.substring(0, 50)}`;
}
