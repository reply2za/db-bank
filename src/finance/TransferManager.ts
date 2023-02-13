import { BankUser } from './BankUser';
import { GuildTextBasedChannel, If, TextBasedChannel } from 'discord.js';
import { BankVisualizer } from './BankVisualizer';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { bank } from './Bank';
import { localStorage } from '../Storage/LocalStorage';
import { getUserResponse, roundNumberTwoDecimals } from '../utils/utils';
import Logger from '../utils/Logger';
import { TransferType } from './types';
import { getAmount, validateAmount, validateMonetaryAmount } from '../utils/numberUtils';

export class TransferManager {
    sender: BankUser;
    embed: EmbedBuilderLocal | null;

    constructor(sender: BankUser) {
        this.sender = sender;
        this.embed = null;
    }

    async processIOUTransfer(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, receiver: BankUser) {
        this.embed = BankVisualizer.getIOUTransferEmbed(this.sender, receiver, 0);
        const embedMsg = await this.embed.send(channel);
        const responseAmt = await getAmount(channel, this.sender.userId);
        if (responseAmt === 'q') {
            channel.send('*cancelled transfer*');
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        const isValid = validateAmount(transferAmount, channel);
        if (!isValid) {
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        this.embed = BankVisualizer.getIOUTransferEmbed(this.sender, receiver, transferAmount);
        await this.embed.edit(embedMsg);
        channel.send('type a short reason/comment for the IOU: ');
        const comment = (await getUserResponse(channel, this.sender.userId))?.content || '';
        this.embed = BankVisualizer.getIOUTransferEmbed(this.sender, receiver, transferAmount, comment);
        await this.embed.edit(embedMsg);
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
                    `[IOU transfer] ${transferAmount} from ${this.sender.name} to ${receiver.name}\n` +
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

    async processMonetaryTransfer(channel: TextBasedChannel, receiver: BankUser) {
        this.embed = BankVisualizer.getCashTransferEmbed(this.sender, receiver, 0);
        const embedMsg = await this.embed.send(channel);
        const responseAmt = await getAmount(channel, this.sender.userId);
        if (responseAmt === 'q') {
            channel.send('*cancelled transfer*');
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        const isValid = validateMonetaryAmount(transferAmount, this.sender, channel);
        if (!isValid) {
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        this.embed = BankVisualizer.getCashTransferEmbed(this.sender, receiver, transferAmount);
        await this.embed.edit(embedMsg);
        await BankVisualizer.getPreTransferConfirmationEmbed().send(channel);
        const responseConfirmation = (await getUserResponse(channel, this.sender.userId))?.content;
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            await bank.transferAmount(this.sender, receiver, transferAmount, channel, TransferType.TRANSFER);
        } else {
            await channel.send('*cancelled transfer*');
        }
    }
}
