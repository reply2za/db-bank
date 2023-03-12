import { OriginalBankUser } from '../../BankUser/OriginalBankUser';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import images from '../../../utils/constants/images';
import { roundNumberTwoDecimals } from '../../../utils/numberUtils';
import { BankUserCopy } from '../../BankUser/BankUserCopy';

export default {
    getChargeTransferEmbed(
        sender: Readonly<BankUserCopy>,
        receiver: Readonly<BankUserCopy>,
        amount = 0,
        comment = ''
    ): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setColor('DarkVividPink')
            .setThumbnail(images.CHARGE_TRANSFER_IMG)
            .setTitle(`Charge ${sender.getName()}`)
            .setDescription(
                (amount ? `charging \`$${amount.toFixed(2)}\`` : '*no amount selected*').concat(
                    `${comment ? `\ncomment: ${comment}` : ''}`
                )
            )
            .setFooter(
                `sender's balance: $${sender.getBalance().toFixed(2)}${
                    amount ? ` => ${roundNumberTwoDecimals(sender.getBalance() - amount).toFixed(2)}` : ''
                }`
            );
    },
    getChargeNotificationEmbed(
        sender: Readonly<OriginalBankUser>,
        receiverName: string,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `*${comment}*\n` : '').concat(
            `amount: $${transferAmount.toFixed(2)}\nyour balance: $${sender.getBalance().toFixed(2)}`
        );
        return new EmbedBuilderLocal()
            .setTitle(`Charged by ${receiverName}`)
            .setDescription(description)
            .setColor('LuminousVividPink')
            .setThumbnail(images.getChargeImage(transferAmount));
    },
    getChargeReceiptEmbed(senderName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setDescription(`charged ${senderName} $${transferAmount.toFixed(2)}`)
            .setColor('Blurple');
    },
};
