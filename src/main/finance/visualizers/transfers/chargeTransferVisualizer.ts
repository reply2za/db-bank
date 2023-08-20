import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import images from '../../../utils/constants/images';
import { convertToCurrency, roundNumberTwoDecimals } from '../../../utils/numberUtils';
import { BankUserCopy } from '../../BankUser/BankUserCopy';
import { config } from '../../../utils/constants/constants';

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
            .setTitle(`Charge ${sender.getUsername()}`)
            .setDescription(
                (amount ? `charging \`${convertToCurrency(amount)}\`` : config.NO_AMT_SELECTED_TXT).concat(
                    `${comment ? `\ncomment: *${comment}*` : ''}`
                )
            )
            .setFooter(
                `sender's balance: ${convertToCurrency(sender.getBalance())}${
                    amount ? ` => ${convertToCurrency(roundNumberTwoDecimals(sender.getBalance() - amount))}` : ''
                }`
            );
    },
    getChargeNotificationEmbed(
        sender: Readonly<BankUserCopy>,
        receiverName: string,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `*${comment}*\n` : '').concat(
            `amount: ${convertToCurrency(transferAmount)}\nyour balance: ${convertToCurrency(sender.getBalance())}`
        );
        return new EmbedBuilderLocal()
            .setTitle(`Charged by ${receiverName}`)
            .setDescription(description)
            .setColor('LuminousVividPink')
            .setThumbnail(images.getChargeImage(transferAmount));
    },
    getChargeReceiptEmbed(senderName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setDescription(`charged ${senderName} ${convertToCurrency(transferAmount)}`)
            .setColor('Blurple');
    },
};
