import { MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import { TransferType } from '../../../finance/types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { Message, TextChannel } from 'discord.js';
import { BankUserCopy } from '../../../finance/BankUser/BankUserCopy';
import { ACashTransfer } from '../../../finance/Transfer/ACashTransfer';
import cashTransferVisualizer from '../../../finance/visualizers/transfers/cashTransferVisualizer';

exports.run = async (event: MessageEventLocal) => {
    const receiver = await Credit.getUserToTransferTo(event.message, event.args.join(' '), event.data);
    if (!receiver) return;
    await new Credit(<TextChannel>event.message.channel, event.bankUser, receiver).processTransfer();
};

class Credit extends ACashTransfer {
    #MAX_CREDIT_AMT = 100_000_000;
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver, TransferType.CREDIT, sender);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, 'credit', eventData);
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
            this.channel.send(
                `\`You can only credit a maximum of $${this.#MAX_CREDIT_AMT.toLocaleString()} at a time.\``
            );
            return false;
        }
        return true;
    }
}
