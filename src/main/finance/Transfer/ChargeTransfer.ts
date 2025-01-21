import { ACashTransfer } from './ACashTransfer';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { TransferType } from '../types';
import { bank } from '../Bank';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import chargeTransferVisualizer from '../visualizers/transfers/chargeTransferVisualizer';
import { MessageChannel } from '../../utils/types';
import { ABankUser } from '../BankUser/ABankUser';

export class ChargeTransfer extends ACashTransfer {
    constructor(channel: MessageChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver, TransferType.CHARGE, receiver);
    }

    static getUserToTransferTo(
        bankUser: ABankUser,
        channel: MessageChannel,
        name: string,
        message: Message,
        eventData: any
    ): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(bankUser, channel, name, message, eventData, 'charge');
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        const status = await bank.chargeAmount(
            this.sender.getUserId(),
            this.receiver.getUserId(),
            transferAmount,
            this.channel,
            comment
        );
        return status.success;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return chargeTransferVisualizer.getChargeTransferEmbed(this.sender, this.receiver, amount, comment);
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        return await super.validateAmount(transferAmount, channel);
    }

    protected async postSuccessfulTransferAction(
        sender: BankUserCopy,
        receiver: BankUserCopy,
        transferAmount: number,
        comment: string,
        channel: TextChannel
    ) {
        await chargeTransferVisualizer.getChargeReceiptEmbed(sender.getUsername(), transferAmount).send(channel);
        try {
            await sender.getDiscordUser().send({
                embeds: [
                    chargeTransferVisualizer
                        .getChargeNotificationEmbed(sender, receiver.getUsername(), transferAmount, comment)
                        .build(),
                ],
            });
        } catch (e) {
            throw new Error('Could not send transfer notification to sender');
        }
    }
}
