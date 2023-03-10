import { BankUser } from '../../BankUser';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import images from '../../../utils/constants/images';
import { roundNumberTwoDecimals } from '../../../utils/numberUtils';

export default {
    getChargeTransferEmbed(
        sender: Readonly<BankUser>,
        receiver: Readonly<BankUser>,
        amount = 0,
        comment = ''
    ): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setColor('DarkVividPink')
            .setThumbnail(images.CHARGE_TRANSFER_IMG)
            .setTitle(`Charge ${sender.name}`)
            .setDescription(
                (amount ? `charging \`$${amount.toFixed(2)}\`` : '*no amount selected*').concat(
                    `${comment ? `\ncomment: ${comment}` : ''}`
                )
            )
            .setFooter(
                `sender's balance: $${sender.balance.toFixed(2)}${
                    amount ? ` => ${roundNumberTwoDecimals(sender.balance - amount).toFixed(2)}` : ''
                }`
            );
    },
    getChargeNotificationEmbed(
        sender: Readonly<BankUser>,
        receiverName: string,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `*${comment}*\n` : '').concat(
            `amount: $${transferAmount.toFixed(2)}\nyour balance: $${sender.balance.toFixed(2)}`
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
