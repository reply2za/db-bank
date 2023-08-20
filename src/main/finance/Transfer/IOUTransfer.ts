import { Transfer } from './Transfer';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import iouTransferVisualizer from '../visualizers/transfers/iouTransferVisualizer';
import { bank } from '../Bank';
import visualizerCommon from '../visualizers/visualizerCommon';
import { formatErrorText } from '../../utils/utils';
import { config } from '../../utils/constants/constants';

export class IOUTransfer extends Transfer {
    MINIMUM_TRANSFER_AMT = 1;
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, 'transfer IOUs', eventData);
    }

    getTransferEmbed(amount: number, comment: string): EmbedBuilderLocal {
        return iouTransferVisualizer.getIOUTransferEmbed(this.sender, this.receiver, Math.floor(amount), comment);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        transferAmount = Math.floor(transferAmount);
        const transferResponse = await bank.transferIOU(
            this.sender.getUserId(),
            this.receiver.getUserId(),
            transferAmount,
            comment,
            this.channel
        );
        if (transferResponse.success) {
            this.sender.addHistoryEntry(this.receiver.getUserId());
            return true;
        } else {
            await visualizerCommon
                .getErrorEmbed(`transfer failed: ${transferResponse.failReason || 'unknown reason'}`)
                .send(this.channel);
        }
        return false;
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        return (
            (await super.validateAmount(transferAmount, channel)) &&
            (() => {
                if (Math.floor(transferAmount) !== transferAmount) {
                    channel.send(formatErrorText('cannot send partial IOUs'));
                    return false;
                }
                if (transferAmount > config.maxIOUCountPerReq) {
                    channel.send(formatErrorText(`cannot send more than ${config.maxIOUCountPerReq} IOUs`));
                    return false;
                }
                return true;
            })()
        );
    }

    protected async postSuccessfulTransferAction(
        sender: BankUserCopy,
        receiver: BankUserCopy,
        transferAmount: number,
        comment: string,
        channel: TextChannel
    ): Promise<void> {
        await receiver.getDiscordUser().send({
            embeds: [
                iouTransferVisualizer
                    .getIOUTransferNotificationEmbed(sender.getUsername(), receiver, transferAmount, comment)
                    .build(),
            ],
        });
        await iouTransferVisualizer.getIOUTransferReceiptEmbed(receiver.getUsername(), transferAmount).send(channel);
    }
}
