import { EmbedBuilderLocal } from '../utils/EmbedBuilderLocal';
import { GuildTextBasedChannel, If, Message, TextBasedChannel } from 'discord.js';
import { BankUser } from './BankUser';
import { BANK_IMG, bot, MoneyImage, TRANSFER_IMG, TRANSFER_IOU_IMG } from '../utils/constants';
import { IOUTicket } from './IOUTicket';

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
                `balance: $${user.getBalance()}\n${
                    iouDescription.length ? `\n- **Received IOUs** -\n${iouDescription}` : ''
                }`
            )
            .setThumbnail(BANK_IMG)
            .setFooter("use 'help' to view available commands")
            .send(channel);
    }

    static getCoreTransferEmbed() {
        return new EmbedBuilderLocal().setColor('Purple').setThumbnail(TRANSFER_IMG);
    }

    static getIOUTransferEmbed(sender: Readonly<BankUser>, receiver: Readonly<BankUser>, amount = 0) {
        const e = this.getCoreTransferEmbed();
        return e
            .setTitle(`Transfer IOU to ${receiver.name}`)
            .setDescription(amount ? `sending ${amount} IOU` : '*no amount selected*');
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
            .setFooter(`your balance: $${sender.balance}${amount ? ` => ${sender.balance - amount}` : ''}`);
    }

    static getPreTransferConfirmationEmbed(): EmbedBuilderLocal {
        return new EmbedBuilderLocal().setDescription("confirm transfer? Type 'yes' or 'no'").setColor('Yellow');
    }

    static getTransferNotificationEmbed(
        senderName: string,
        receiver: Readonly<BankUser>,
        transferAmount: number
    ): EmbedBuilderLocal {
        return new EmbedBuilderLocal()
            .setTitle(`${senderName} sent you money`)
            .setDescription(`amount: $${transferAmount}\nyour balance: $${receiver.balance}`)
            .setColor('Green')
            .setThumbnail(this.getTransferImage(transferAmount));
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
}

export { BankVisualizer };
