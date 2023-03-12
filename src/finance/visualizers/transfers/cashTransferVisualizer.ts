import { OriginalBankUser } from '../../BankUser/OriginalBankUser';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import { roundNumberTwoDecimals } from '../../../utils/numberUtils';
import visualizerCommon from '../visualizerCommon';
import images from '../../../utils/constants/images';
import { BankUserCopy } from '../../BankUser/BankUserCopy';

export default {
    getCashTransferEmbed(
        sender: Readonly<BankUserCopy>,
        receiver: Readonly<BankUserCopy>,
        amount = 0,
        comment?: string
    ): EmbedBuilderLocal {
        const e = visualizerCommon.getCoreTransferEmbed();
        return e
            .setTitle(`Transfer to ${receiver.getName()}`)
            .setDescription(
                (amount ? `sending \`$${amount.toFixed(2)}\`` : '*no amount selected*').concat(
                    `${comment ? `\ncomment: ${comment}` : ''}`
                )
            )
            .setFooter(
                `your balance: $${sender.getBalance().toFixed(2)}${
                    amount ? ` => ${roundNumberTwoDecimals(sender.getBalance() - amount).toFixed(2)}` : ''
                }`
            );
    },
    getTransferNotificationEmbed(
        senderName: string,
        receiver: Readonly<OriginalBankUser>,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `comment: *${comment}*\n` : '').concat(
            `amount: $${transferAmount.toFixed(2)}\nyour balance: $${receiver.getBalance().toFixed(2)}`
        );
        return new EmbedBuilderLocal()
            .setTitle(`${senderName} sent you money`)
            .setDescription(description)
            .setColor('Green')
            .setThumbnail(images.getTransferImage(transferAmount));
    },
    getTransferReceiptEmbed(receiverName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setDescription(`sent $${transferAmount.toFixed(2)} to ${receiverName}`)
            .setColor('Blurple');
    },
};
