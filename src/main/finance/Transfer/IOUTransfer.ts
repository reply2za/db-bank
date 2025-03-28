import { Transfer } from './Transfer';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import iouTransferVisualizer from '../visualizers/transfers/iouTransferVisualizer';
import { bank } from '../Bank';
import visualizerCommon from '../visualizers/visualizerCommon';
import { formatErrorText } from '../../utils/utils';
import { config } from '../../utils/constants/constants';
import { ABankUser } from '../BankUser/ABankUser';
import { MessageChannel } from '../../utils/types';

export class IOUTransfer extends Transfer {
    override MINIMUM_TRANSFER_AMT = 1;
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    static override getUserToTransferTo(
        bankUser: ABankUser,
        channel: MessageChannel,
        name: string,
        message: Message,
        eventData: any
    ): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(bankUser, channel, name, message, eventData, 'transfer IOUs');
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

    protected override async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
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
        await iouTransferVisualizer.getIOUTransferReceiptEmbed(receiver.getUsername(), transferAmount).send(channel);
        try {
            await receiver.getDiscordUser().send({
                embeds: [
                    iouTransferVisualizer
                        .getIOUTransferNotificationEmbed(sender.getUsername(), receiver, transferAmount, comment)
                        .build(),
                ],
            });
        } catch (e) {
            throw new Error('Could not send transfer notification to receiver');
        }
    }
}
