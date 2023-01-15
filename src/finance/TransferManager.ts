import { BankUser } from './BankUser';
import { GuildTextBasedChannel, If, TextBasedChannel } from 'discord.js';
import { BankVisualizer } from './BankVisualizer';
import { EmbedBuilderLocal } from '../utils/EmbedBuilderLocal';
import { bank } from './Bank';
import { localStorage } from '../Storage/LocalStorage';
import { getUserResponse, log, roundNumberTwoDecimals } from '../utils/utils';

export class TransferManager {
    sender: BankUser;
    embed: EmbedBuilderLocal | null;

    constructor(sender: BankUser) {
        this.sender = sender;
        this.embed = null;
    }
    async processMonetaryTransfer(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, receiver: BankUser) {
        this.embed = BankVisualizer.getTransferEmbed(this.sender, receiver, 0);
        const embedMsg = await this.embed.send(channel);
        const enterAmountMsg = await new EmbedBuilderLocal()
            .setDescription('enter the amount you would like to send')
            .send(channel);
        const responseAmt = (await getUserResponse(channel, this.sender.userId))?.content;
        enterAmountMsg.deletable && enterAmountMsg.delete();
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        if (!Number.isFinite(transferAmount)) {
            return channel.send('*cancelled transfer: invalid input*');
        }
        if (transferAmount <= 0) {
            return channel.send('*cancelled transfer: amount must be greater than 0*');
        }
        this.embed = BankVisualizer.getTransferEmbed(this.sender, receiver, transferAmount);
        await this.embed.edit(embedMsg);
        await BankVisualizer.getPreTransferConfirmationEmbed().send(channel);
        const responseConfirmation = (await getUserResponse(channel, this.sender.userId))?.content;
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            const transferResponse = bank.transferAmount(this.sender, receiver, transferAmount);
            if (transferResponse.success) {
                await localStorage.saveData(bank.serializeData());
                await receiver.getDiscordUser().send({
                    embeds: [
                        BankVisualizer.getTransferNotificationEmbed(this.sender.name, receiver, transferAmount).build(),
                    ],
                });
                await log(
                    `[transfer] $${transferAmount} from ${this.sender.name} to ${receiver.name}\n` +
                        `new balances:\n` +
                        `${this.sender.name}: ${this.sender.balance}\n` +
                        `${receiver.name}: ${receiver.balance}\n`
                );
                await BankVisualizer.getTransferReceiptEmbed(receiver.name, transferAmount).send(channel);
            } else {
                await BankVisualizer.getErrorEmbed(
                    `transfer failed: ${transferResponse.failReason || 'unknown reason'}`
                ).send(channel);
            }
        } else {
            channel.send('*cancelled transfer*');
        }
    }
}
