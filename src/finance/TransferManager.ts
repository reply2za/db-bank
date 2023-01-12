import {BankUser} from "./BankUser";
import {GuildTextBasedChannel, If, Message, TextBasedChannel} from "discord.js";
import {BankVisualizer} from "./BankVisualizer";
import {EmbedBuilderLocal} from "../utils/EmbedBuilderLocal";
import {bank} from "./Bank";
import {localStorage} from "../Storage/LocalStorage";
import {getUserResponse, log, roundNumberTwoDecimals} from "../utils/utils";
import {MoneyImage} from "../constants";


export class TransferManager {
    sender: BankUser;
    embed: EmbedBuilderLocal | null;

    constructor(sender: BankUser) {
        this.sender = sender
        this.embed = null;
    }
    async processMonetaryTransfer(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, receiver: BankUser) {
        this.embed = BankVisualizer.getTransferEmbed(channel, this.sender, receiver, 0);
        const embedMsg = await this.embed.send(channel);
        const enterAmountMsg = await (new EmbedBuilderLocal)
            .setDescription('enter the amount you would like to send')
            .send(channel);

        const responseAmt = await getUserResponse(channel, this.sender.userId);
        enterAmountMsg.deletable && enterAmountMsg.delete();
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        if (!Number.isFinite(transferAmount)) {
            return channel.send('*cancelled transfer: invalid input*');
        }
        if (transferAmount <= 0) {
            return channel.send('*cancelled transfer: amount must be greater than 0*');
        }
        this.embed = BankVisualizer.getTransferEmbed(channel, this.sender, receiver, transferAmount);
        await this.embed.edit(embedMsg)
        await (new EmbedBuilderLocal)
            .setDescription('confirm transfer? Type \'yes\' or \'no\'')
            .setColor('Yellow')
            .send(channel);
        const responseConfirmation = await getUserResponse(channel, this.sender.userId);
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            const transferResponse = bank.transferAmount(this.sender, receiver, transferAmount);
            if (transferResponse.success) {
                await localStorage.saveData(bank.serializeData());
                await receiver.getDiscordUser().send({embeds: [
                    (new EmbedBuilderLocal())
                        .setTitle(`${this.sender.name} sent you money`)
                        .setDescription(`amount: $${transferAmount}\nyour balance: $${receiver.balance}`)
                        .setColor("Green")
                        .setThumbnail(this.getTransferImage(transferAmount))
                        .build()
                    ]})
                await log(`[transfer] $${transferAmount} from ${this.sender.name} to ${receiver.name}\n` +
                    `new balances:\n` + `${this.sender.name}: ${this.sender.balance}\n` +
                    `${receiver.name}: ${receiver.balance}\n`);
                await (new EmbedBuilderLocal)
                    .setDescription(`sent $${transferAmount} to ${receiver.name}`)
                    .setColor('Blurple')
                    .send(channel);
            } else {
                await (new EmbedBuilderLocal)
                    .setDescription(`transfer failed: ${transferResponse.failReason || 'unknown reason'}`)
                    .setColor('Red')
                    .send(channel);
            }
        } else {
            channel.send('*cancelled transfer*');
        }
    }

    private getTransferImage(transferAmount: number) {
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
