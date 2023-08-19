import { OriginalBankUser } from '../../BankUser/OriginalBankUser';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { convertToCurrency, roundNumberTwoDecimals } from '../../../utils/numberUtils';
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
        const e = new EmbedBuilderLocal().setColor('Green').setThumbnail(images.CASH_TRANSFER_IMG);
        return e
            .setTitle(`Transfer to ${receiver.getUsername()}`)
            .setDescription(
                (amount ? `sending \`${convertToCurrency(amount)}\`` : '*no amount selected*').concat(
                    `${comment ? `\ncomment: *${comment}*` : ''}`
                )
            )
            .setFooter(
                `your balance: ${convertToCurrency(sender.getBalance())}${
                    amount ? ` => ${convertToCurrency(roundNumberTwoDecimals(sender.getBalance() - amount))}` : ''
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
            `amount: ${convertToCurrency(transferAmount)}\nyour balance: ${convertToCurrency(receiver.getBalance())}`
        );
        return new EmbedBuilderLocal()
            .setTitle(`${senderName} sent you money`)
            .setDescription(description)
            .setColor('Green')
            .setThumbnail(images.getTransferImage(transferAmount));
    },
    getTransferReceiptEmbed(receiverName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setDescription(`sent ${convertToCurrency(transferAmount)} to ${receiverName}`)
            .setColor('Blurple');
    },
    getCreditTransferEmbed(receiver: Readonly<BankUserCopy>, amount = 0, comment?: string): EmbedBuilderLocal {
        const e = new EmbedBuilderLocal().setColor('#7eff74').setThumbnail(images.CREDIT_TRANSFER_IMG);
        return e
            .setTitle(`Credit ${receiver.getUsername()}`)
            .setDescription(
                (amount ? `sending \`${convertToCurrency(amount)}\`` : '*no amount selected*').concat(
                    `${comment ? `\ncomment: *${comment}*` : ''}`
                )
            )
            .setFooter(
                `${receiver.getUsername()}'s balance: ${convertToCurrency(receiver.getBalance())}${
                    amount ? ` => ${convertToCurrency(roundNumberTwoDecimals(receiver.getBalance() + amount))}` : ''
                }`
            );
    },
};
