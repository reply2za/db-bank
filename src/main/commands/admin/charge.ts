import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { TransferType } from '../../finance/types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { Message, TextChannel } from 'discord.js';
import chargeTransferVisualizer from '../../finance/visualizers/transfers/chargeTransferVisualizer';
import { BankUserCopy } from '../../finance/BankUser/BankUserCopy';
import { ACashTransfer } from '../../finance/Transfer/ACashTransfer';
import { formatErrorText } from '../../utils/utils';

exports.run = async (event: MessageEventLocal) => {
    const sender = await Charge.getUserToTransferTo(event.message, event.args.join(' '), event.data);
    if (!sender) return;
    await new Charge(<TextChannel>event.message.channel, sender, event.bankUser).processTransfer();
};

class Charge extends ACashTransfer {
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
}
