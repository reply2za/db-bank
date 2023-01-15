import {EmbedBuilderLocal} from "../utils/EmbedBuilderLocal";
import {GuildTextBasedChannel, If, Message, TextBasedChannel} from "discord.js";
import {BankUser} from "./BankUser";
import {BANK_IMG, MoneyImage, TRANSFER_IMG} from "../utils/constants";

class BankVisualizer {
    static showBalance(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, user: Readonly<BankUser>): Promise<Message> {
        return (new EmbedBuilderLocal)
            .setTitle(`${user.name}\'s Bank`)
            .setColor('Green')
            .setDescription(`$${user.getBalance()}`)
            .setThumbnail(BANK_IMG)
            .send(channel);
    }

    static getTransferEmbed(sender: Readonly<BankUser>, receiver: Readonly<BankUser> , amount = 0): EmbedBuilderLocal {
        return (new EmbedBuilderLocal)
            .setTitle(`Transfer to ${receiver.name}`)
            .setFooter(`your balance: $${sender.balance}`)
            .setColor('Greyple')
            .setThumbnail(TRANSFER_IMG)
            .setDescription(amount ? `sending $${amount}` : '*no amount selected*');
    }

    static getPreTransferConfirmationEmbed(): EmbedBuilderLocal {
        return (new EmbedBuilderLocal)
            .setDescription('confirm transfer? Type \'yes\' or \'no\'')
            .setColor('Yellow')
    }

    static getTransferNotificationEmbed(senderName: string, receiver: Readonly<BankUser>, transferAmount: number): EmbedBuilderLocal {
        return (new EmbedBuilderLocal())
            .setTitle(`${senderName} sent you money`)
            .setDescription(`amount: $${transferAmount}\nyour balance: $${receiver.balance}`)
            .setColor("Green")
            .setThumbnail(this.getTransferImage(transferAmount))
    }

    static getTransferReceiptEmbed(receiverName: string, transferAmount:number): EmbedBuilderLocal {
        return (new EmbedBuilderLocal)
            .setDescription(`sent $${transferAmount} to ${receiverName}`)
            .setColor('Blurple')
    }

    static getErrorEmbed(description: string): EmbedBuilderLocal{
        return (new EmbedBuilderLocal)
            .setDescription(description)
            .setColor('Red')
    }

    private static getTransferImage(transferAmount: number): string {
        if (transferAmount < 1) {
            return MoneyImage.TINY;
        }
        else if (transferAmount < 5) {
            return MoneyImage.SMALL;
        }
        else if (transferAmount < 20) {
            return MoneyImage.MEDIUM
        } else {
            return MoneyImage.LARGE
        }
    }
}

export {BankVisualizer};
