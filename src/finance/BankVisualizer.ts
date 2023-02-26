import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { GuildTextBasedChannel, If, Message, TextBasedChannel } from 'discord.js';
import { BankUser } from './BankUser';
import {
    BANK_IMG,
    bot,
    ChargeImage,
    MoneyImage,
    REDEEM_IOU_IMG,
    SENT_IOU_IMG,
    TRANSFER_IMG,
    TRANSFER_IOU_IMG,
} from '../utils/constants';
import { IOUTicket } from './IOUTicket';
import { roundNumberTwoDecimals } from '../utils/numberUtils';

class BankVisualizer {
    static async showBalance(
        channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>,
        user: Readonly<BankUser>,
        ious: IOUTicket[]
    ): Promise<Message> {
        let iouDescription = '';
        const iouMap = new Map<string, number>();
        for (const iou of ious) {
            iouMap.set(iou.sender.id, (iouMap.get(iou.sender.id) || 0) + 1);
        }
        for (const [key, value] of iouMap) {
            const sender = await bot.users.fetch(key);
            iouDescription += `${sender.username}: ${value}\n`;
        }
        return new EmbedBuilderLocal()
            .setTitle(`${user.name}'s Bank`)
            .setColor('Green')
            .setDescription(
                `\`$${user.getBalance()}\`\n${
                    iouDescription.length ? `\n- **Received IOUs** -\n${iouDescription}` : ''
                }`
            )
            .setFooter(`transfer cash | transfer IOUs${iouDescription.length ? ' | view IOUs' : ''}`)
            .setThumbnail(BANK_IMG)
            .send(channel);
    }

    static getCoreTransferEmbed(): EmbedBuilderLocal {
        return new EmbedBuilderLocal().setColor('Purple').setThumbnail(TRANSFER_IMG);
    }

    static getIOUTransferEmbed(
        sender: Readonly<BankUser>,
        receiver: Readonly<BankUser>,
        amount = 0,
        comment = ''
    ): EmbedBuilderLocal {
        return this.getCoreTransferEmbed()
            .setTitle(`Transfer IOU to ${receiver.name}`)
            .setDescription(amount ? `sending ${amount} IOU${amount > 1 ? 's' : ''}` : '*no amount selected*')
            .setFooter(`${comment ? `comment: ${comment}` : ' '}`);
    }

    static getCashTransferEmbed(
        sender: Readonly<BankUser>,
        receiver: Readonly<BankUser>,
        amount = 0
    ): EmbedBuilderLocal {
        const e = this.getCoreTransferEmbed();
        return e
            .setTitle(`Transfer to ${receiver.name}`)
            .setDescription(amount ? `sending $${amount}` : '*no amount selected*')
            .setFooter(
                `your balance: $${sender.balance}${
                    amount ? ` => ${roundNumberTwoDecimals(sender.balance - amount)}` : ''
                }`
            );
    }

    static getConfirmationEmbed(actionName = ''): EmbedBuilderLocal {
        if (actionName) actionName = ` ${actionName}`;
        return new EmbedBuilderLocal().setDescription(`confirm${actionName}? Type 'yes' or 'no'`).setColor('Yellow');
    }

    static getTransferNotificationEmbed(
        senderName: string,
        receiver: Readonly<BankUser>,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `*${comment}*\n` : '').concat(
            `amount: $${transferAmount}\nyour balance: $${receiver.balance}`
        );
        return new EmbedBuilderLocal()
            .setTitle(`${senderName} sent you money`)
            .setDescription(description)
            .setColor('Green')
            .setThumbnail(this.getTransferImage(transferAmount));
    }

    static getChargeNotificationEmbed(
        sender: Readonly<BankUser>,
        receiverName: string,
        transferAmount: number,
        comment = ''
    ): EmbedBuilderLocal {
        const description = (comment ? `*${comment}*\n` : '').concat(
            `amount: $${transferAmount}\nyour balance: $${sender.balance}`
        );
        return new EmbedBuilderLocal()
            .setTitle(`Charged by ${receiverName}`)
            .setDescription(description)
            .setColor('LuminousVividPink')
            .setThumbnail(this.getChargeImage(transferAmount));
    }

    static getIOUTransferNotificationEmbed(
        senderName: string,
        receiver: Readonly<BankUser>,
        transferAmount: number,
        comment: string
    ): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setTitle(`${senderName} sent you ${transferAmount < 2 ? 'an IOU' : `${transferAmount} IOUs`}`)
            .setDescription(`comment: ${comment || 'not provided'}`)
            .setColor('Gold')
            .setThumbnail(TRANSFER_IOU_IMG);
    }

    /**
     * Should the reedeem IOU interface
     * @param ious The IOU list
     * @param highlight The index of the iou ticket to highlight/focus.
     */
    static getRedeemableIOUEmbed(ious: IOUTicket[], highlight?: number) {
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
            .setThumbnail(REDEEM_IOU_IMG);
    }

    static getSentIOUEmbed(ious: IOUTicket[]) {
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
            .setThumbnail(SENT_IOU_IMG);
    }

    static getTransferReceiptEmbed(receiverName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal().setDescription(`sent $${transferAmount} to ${receiverName}`).setColor('Blurple');
    }

    static getIOUTransferReceiptEmbed(receiverName: string, transferAmount: number): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setDescription(`sent ${transferAmount < 2 ? 'an IOU' : `${transferAmount} IOUs`} to ${receiverName}`)
            .setColor('Blurple');
    }

    static getErrorEmbed(description: string): EmbedBuilderLocal {
        return new EmbedBuilderLocal().setDescription(description).setColor('Red');
    }

    private static getTransferImage(transferAmount: number): string {
        if (transferAmount < 1) {
            return MoneyImage.TINY;
        } else if (transferAmount < 5) {
            return MoneyImage.SMALL;
        } else if (transferAmount < 20) {
            return MoneyImage.MEDIUM;
        } else {
            return MoneyImage.LARGE;
        }
    }

    private static getChargeImage(transferAmount: number): string {
        if (transferAmount < 7) {
            return ChargeImage.SB_CREDIT_CARD;
        } else if (transferAmount < 25) {
            return ChargeImage.SW_BILL_LIST;
        } else {
            return ChargeImage.MK_BILL_LIST;
        }
    }
}

export { BankVisualizer };
