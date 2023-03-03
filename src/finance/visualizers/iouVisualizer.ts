import { IOUTicket } from '../IOUTicket';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import images from '../../utils/constants/images';

export default {
    getRedeemableIOUEmbed(ious: IOUTicket[], highlight?: number) {
        let descriptionText = '';
        let i = 1;
        if (highlight !== undefined) highlight++;
        for (const singleIOU of ious) {
            const iouDescription = `${i}. **${singleIOU.sender.name}**: ${singleIOU.comment.substring(0, 50)}`;
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
    getSentIOUEmbed(ious: IOUTicket[]) {
        let descriptionText = '';
        let i = 1;
        for (const singleIOU of ious) {
            descriptionText += `${i}. **${singleIOU.receiver.name}**: *${singleIOU.comment.substring(0, 50)}*`;
            descriptionText += '\n';
            i++;
        }
        return new EmbedBuilderLocal()
            .setTitle(`Your sent IOUs to`)
            .setDescription(descriptionText)
            .setColor('Fuchsia')
            .setThumbnail(images.SENT_IOU_IMG);
    },
};
