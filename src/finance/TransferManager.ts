import { BankUser } from './BankUser';
import { GuildTextBasedChannel, If, TextBasedChannel } from 'discord.js';
import { BankVisualizer } from './BankVisualizer';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { bank } from './Bank';
import { localStorage } from '../Storage/LocalStorage';
import { getUserResponse, roundNumberTwoDecimals } from '../utils/utils';
import Logger from '../utils/Logger';

export class TransferManager {
    sender: BankUser;
    embed: EmbedBuilderLocal | null;

    constructor(sender: BankUser) {
        this.sender = sender;
        this.embed = null;
    }

    async getAmount(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>) {
        const enterAmountMsg = await new EmbedBuilderLocal()
            .setDescription('enter the amount you would like to send')
            .setFooter('or `q` to quit')
            .send(channel);
        const response = await getUserResponse(channel, this.sender.userId);
        enterAmountMsg.deletable && enterAmountMsg.delete();
        return response?.content;
    }

    /**
     * Returns whether the amount provided is acceptable.
     * @param transferAmount
     * @param channel
     */
    validateAmount(transferAmount: any, channel?: If<boolean, GuildTextBasedChannel, TextBasedChannel>): boolean {
        if (!Number.isFinite(transferAmount)) {
            channel?.send('*cancelled transfer: `invalid input`*');
            return false;
        }
        if (transferAmount <= 0) {
            channel?.send('*cancelled transfer: `amount must be greater than 0`*');
            return false;
        }
        return true;
    }

    /**
     * Returns whether the amount provided is acceptable.
     * @param transferAmount
     * @param channel
     */
    validateMonetaryAmount(
        transferAmount: any,
        channel?: If<boolean, GuildTextBasedChannel, TextBasedChannel>
    ): boolean {
        if (!this.validateAmount(transferAmount, channel)) return false;
        if (transferAmount > this.sender.balance) {
            channel?.send('*cancelled transfer: `your balance is too low`*');
            return false;
        }
        return true;
    }

    async processIOUTransfer(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, receiver: BankUser) {
        this.embed = BankVisualizer.getIOUTransferEmbed(this.sender, receiver, 0);
        const embedMsg = await this.embed.send(channel);
        const responseAmt = await this.getAmount(channel);
        if (responseAmt === 'q') {
            channel.send('*cancelled transfer*');
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        const isValid = this.validateAmount(transferAmount, channel);
        if (!isValid) {
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        this.embed = BankVisualizer.getIOUTransferEmbed(this.sender, receiver, transferAmount);
        await this.embed.edit(embedMsg);
        channel.send('type a short reason/comment for the IOU: ');
        const comment = (await getUserResponse(channel, this.sender.userId))?.content || '';
        await BankVisualizer.getPreTransferConfirmationEmbed().send(channel);
        const responseConfirmation = (await getUserResponse(channel, this.sender.userId))?.content;
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            const transferResponse = bank.transferIOU(this.sender, receiver, transferAmount, comment);
            if (transferResponse.success) {
                await localStorage.saveData(bank.serializeData());
                await receiver.getDiscordUser().send({
                    embeds: [
                        BankVisualizer.getIOUTransferNotificationEmbed(
                            this.sender.name,
                            receiver,
                            transferAmount,
                            comment
                        ).build(),
                    ],
                });
                await Logger.transactionLog(
                    `[IOU transfer] $${transferAmount} from ${this.sender.name} to ${receiver.name}\n` +
                        `comment: ${comment || 'N/A'}`
                );
                await BankVisualizer.getIOUTransferReceiptEmbed(receiver.name, transferAmount).send(channel);
            } else {
                await BankVisualizer.getErrorEmbed(
                    `transfer failed: ${transferResponse.failReason || 'unknown reason'}`
                ).send(channel);
            }
        } else {
            channel.send('*cancelled transfer*');
        }
    }

    async processMonetaryTransfer(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, receiver: BankUser) {
        this.embed = BankVisualizer.getCashTransferEmbed(this.sender, receiver, 0);
        const embedMsg = await this.embed.send(channel);
        const responseAmt = await this.getAmount(channel);
        if (responseAmt === 'q') {
            channel.send('*cancelled transfer*');
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        const isValid = this.validateMonetaryAmount(transferAmount, channel);
        if (!isValid) {
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        this.embed = BankVisualizer.getCashTransferEmbed(this.sender, receiver, transferAmount);
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
                await Logger.transactionLog(
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
