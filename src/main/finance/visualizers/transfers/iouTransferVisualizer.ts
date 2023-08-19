import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import visualizerCommon from '../visualizerCommon';
import images from '../../../utils/constants/images';
import { BankUserCopy } from '../../BankUser/BankUserCopy';

export default {
    getIOUTransferEmbed(
        sender: Readonly<BankUserCopy>,
        receiver: Readonly<BankUserCopy>,
        amount = 0,
        comment = ''
    ): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setColor('Purple')
            .setThumbnail(images.TRANSFER_IMG)
            .setTitle(`Transfer IOU to ${receiver.getUsername()}`)
            .setDescription(
                (amount ? `sending ${amount} IOU${amount > 1 ? 's' : ''}` : '*no amount selected*').concat(
                    `${comment ? `\ncomment: *${comment}*` : ' '}`
                )
            );
    },
    getIOUTransferNotificationEmbed(
        senderName: string,
        receiver: Readonly<BankUserCopy>,
        transferAmount: number,
        comment: string
    ): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setTitle(`${senderName} sent you ${transferAmount < 2 ? 'an IOU' : `${transferAmount} IOUs`}`)
            .setDescription(`comment: ${comment || 'not provided'}`)
            .setColor('Gold')
            .setThumbnail(images.TRANSFER_IOU_IMG);
    },
    getIOUTransferReceiptEmbed(receiverName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setDescription(`sent ${transferAmount < 2 ? 'an IOU' : `${transferAmount} IOUs`} to ${receiverName}`)
            .setColor('Blurple');
    },
};
