import { getUserResponse } from '../../../utils/utils';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { Colors, Message, TextChannel } from 'discord.js';
import { bank } from '../../../finance/Bank';
import { TransferType } from '../../../finance/types';
import { Transfer } from '../../../finance/Transfer';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import cashTransferVisualizer from '../../../finance/visualizers/transfers/cashTransferVisualizer';
import { BankUserCopy } from '../../../finance/BankUser/BankUserCopy';

exports.run = async (event: MessageEventLocal) => {
    if (event.args[1]?.toLowerCase() === 'iou') {
        event.args = [event.args[0]];
        await commandHandler.execute({ ...event, statement: 'transferiou', args: [] });
    } else {
        const recipientBankUser = await MonetaryTransfer.getUserToTransferTo(event.message, event.args[1], event.data);
        if (!recipientBankUser) return;
        await new MonetaryTransfer(
            <TextChannel>event.message.channel,
            event.bankUser,
            recipientBankUser
        ).processTransfer();
    }
};

class MonetaryTransfer extends Transfer {
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, 'transfer money', eventData);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
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

    protected async getComment(): Promise<string | undefined> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['b' = blank, 'q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);

        const commentResponse = (await getUserResponse(this.channel, this.sender.getUserId()))?.content;
        if (commentResponse?.toLowerCase() === 'b') return '';
        return commentResponse;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return cashTransferVisualizer.getCashTransferEmbed(this.sender, this.receiver, amount, comment);
    }

    protected async promptForAmount(): Promise<string | undefined> {
        let amt = await super.promptForAmount();
        if (amt) {
            if (amt.charAt(0) === '$') amt = amt.replace('$', '');
            amt = amt.replaceAll(',', '');
        }
        return amt;
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!(await super.validateAmount(transferAmount, channel))) return false;
        if (this.sender.getBalance() < transferAmount) {
            this.channel.send('error: `balance is too low`');
            return false;
        }
        return true;
    }
}
