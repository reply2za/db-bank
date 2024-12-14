import { ACashTransfer } from './ACashTransfer';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { TransferType } from '../types';
import { bank } from '../Bank';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import cashTransferVisualizer from '../visualizers/transfers/cashTransferVisualizer';

export class CreditTransfer extends ACashTransfer {
    #MAX_CREDIT_AMT = 100_000_000;
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver, TransferType.CREDIT, sender);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, eventData, 'credit');
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        const status = await bank.creditAmount(this.receiver.getUserId(), transferAmount, this.channel, comment);
        return status.success;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return cashTransferVisualizer.getCreditTransferEmbed(this.receiver, amount, comment);
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!(await super.validateAmount(transferAmount, channel))) return false;
        if (transferAmount > this.#MAX_CREDIT_AMT) {
            (<TextChannel>this.channel).send(
                `\`You can only credit a maximum of $${this.#MAX_CREDIT_AMT.toLocaleString()} at a time.\``
            );
            return false;
        }
        return true;
    }
}
