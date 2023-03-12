import { getUserResponse, getUserToTransferTo } from '../../../utils/utils';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { Colors, TextChannel } from 'discord.js';
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
        const recipientBankUser = await getUserToTransferTo(event.message, event.args[1], 'transfer money', event.data);
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

    protected async getComment(): Promise<string> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['b' = blank, 'q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);

        const commentResponse = (await getUserResponse(this.channel, this.sender.getUserId()))?.content || '';
        if (commentResponse === 'b') return '';
        return commentResponse;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return cashTransferVisualizer.getCashTransferEmbed(this.sender, this.receiver, amount, comment);
    }
}
