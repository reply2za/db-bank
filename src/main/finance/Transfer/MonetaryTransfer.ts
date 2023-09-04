import { ACashTransfer } from './ACashTransfer';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import Logger from '../../utils/Logger';
import { bank } from '../Bank';
import { TransferType } from '../types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import cashTransferVisualizer from '../visualizers/transfers/cashTransferVisualizer';
import { formatErrorText } from '../../utils/utils';

export class MonetaryTransfer extends ACashTransfer {
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, eventData, 'transfer money');
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        try {
            this.sender.addHistoryEntry(this.receiver.getUserId());
        } catch (e: any) {
            await Logger.errorLog(e);
        }
        const status = await bank.transferAmount(
            this.sender.getUserId(),
            this.receiver.getUserId(),
            transferAmount,
            this.channel,
            TransferType.TRANSFER,
            comment
        );
        return status.success;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return cashTransferVisualizer.getCashTransferEmbed(this.sender, this.receiver, amount, comment);
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!(await super.validateAmount(transferAmount, channel))) return false;
        if (this.sender.getBalance() < transferAmount) {
            this.channel.send(formatErrorText('balance is too low'));
            return false;
        }
        return true;
    }
}
