import { formatErrorText } from '../../../utils/utils';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { Message, TextChannel } from 'discord.js';
import { bank } from '../../../finance/Bank';
import { TransferType } from '../../../finance/types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import cashTransferVisualizer from '../../../finance/visualizers/transfers/cashTransferVisualizer';
import { BankUserCopy } from '../../../finance/BankUser/BankUserCopy';
import { ACashTransfer } from '../../../finance/Transfer/ACashTransfer';
import Logger from '../../../utils/Logger';

exports.run = async (event: MessageEventLocal) => {
    if (event.args[0]?.toLowerCase() === 'iou') {
        await commandHandler.execute({ ...event, statement: 'transferiou', args: event.args.slice(1) });
    } else {
        let history = event.bankUser.getHistory();
        await MonetaryTransfer.printUserHistory(event.message, history);
        let recipientBankUser = await MonetaryTransfer.getUserToTransferTo(
            event.message,
            event.args.join(' '),
            event.data
        );
        if (!recipientBankUser) return;
        await new MonetaryTransfer(
            <TextChannel>event.message.channel,
            event.bankUser,
            recipientBankUser
        ).processTransfer();
    }
};

class MonetaryTransfer extends ACashTransfer {
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, 'transfer money', eventData);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        try {
            this.sender.addHistoryEntry(this.receiver.getUserId());
        } catch (e: any) {
            await Logger.debugLog(e);
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
