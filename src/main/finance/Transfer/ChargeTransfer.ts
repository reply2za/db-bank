import { ACashTransfer } from './ACashTransfer';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { TransferType } from '../types';
import { bank } from '../Bank';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import chargeTransferVisualizer from '../visualizers/transfers/chargeTransferVisualizer';
import { formatErrorText } from '../../utils/utils';

export class ChargeTransfer extends ACashTransfer {
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver, TransferType.CHARGE, receiver);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, 'charge', eventData);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        const status = await bank.transferAmount(
            this.sender.getUserId(),
            this.receiver.getUserId(),
            transferAmount,
            this.channel,
            TransferType.CHARGE,
            comment
        );
        return status.success;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return chargeTransferVisualizer.getChargeTransferEmbed(this.sender, this.receiver, amount, comment);
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!(await super.validateAmount(transferAmount, channel))) return false;
        if (transferAmount > this.sender.getBalance()) {
            await channel.send(formatErrorText("cannot charge more than the sender's balance"));
            return false;
        }
        return true;
    }

    protected async postSuccessfulTransferAction(
        sender: BankUserCopy,
        receiver: BankUserCopy,
        transferAmount: number,
        comment: string,
        channel: TextChannel
    ) {
        await sender.getDiscordUser().send({
            embeds: [
                chargeTransferVisualizer
                    .getChargeNotificationEmbed(sender, receiver.getUsername(), transferAmount, comment)
                    .build(),
            ],
        });
        await chargeTransferVisualizer.getChargeReceiptEmbed(sender.getUsername(), transferAmount).send(channel);
    }
}
