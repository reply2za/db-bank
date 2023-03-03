import { BankUser } from '../../BankUser';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import { roundNumberTwoDecimals } from '../../../utils/numberUtils';
import visualizerCommon from '../visualizerCommon';
import images from '../../../utils/constants/images';

export default {
    getCashTransferEmbed(sender: Readonly<BankUser>, receiver: Readonly<BankUser>, amount = 0): EmbedBuilderLocal {
        const e = visualizerCommon.getCoreTransferEmbed();
        return e
            .setTitle(`Transfer to ${receiver.name}`)
            .setDescription(amount ? `sending $${amount.toFixed(2)}` : '*no amount selected*')
            .setFooter(
                `your balance: $${sender.balance.toFixed(2)}${
                    amount ? ` => ${roundNumberTwoDecimals(sender.balance - amount).toFixed(2)}` : ''
                }`
            );
    },
    getTransferNotificationEmbed(
        senderName: string,
        receiver: Readonly<BankUser>,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `*${comment}*\n` : '').concat(
            `amount: $${transferAmount.toFixed(2)}\nyour balance: $${receiver.balance.toFixed(2)}`
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
