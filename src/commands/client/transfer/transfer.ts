import { getUserToTransferTo } from '../../../utils/utils';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { BankUser } from '../../../finance/BankUser';
import { BankVisualizer } from '../../../finance/BankVisualizer';
import { bank } from '../../../finance/Bank';
import { TransferType } from '../../../finance/types';
import { Transfer } from '../../../finance/Transfer';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';

exports.run = async (event: MessageEventLocal) => {
    if (event.args[1]?.toLowerCase() === 'iou') {
        event.args = [event.args[0]];
        await commandHandler.execute({ ...event, statement: 'transferiou', args: [] });
    } else {
        const recipientBankUser = await getUserToTransferTo(event.message, event.args[1], 'transfer money');
        if (!recipientBankUser) return;
        await new MonetaryTransfer(
            <TextChannel>event.message.channel,
            event.bankUser,
            recipientBankUser
        ).processTransfer();
    }
};

class MonetaryTransfer extends Transfer {
    constructor(channel: TextChannel, sender: BankUser, receiver: BankUser) {
        super(channel, sender, receiver);
    }
    protected async approvedTransactionAction(transferAmount: number, comment: string): Promise<void> {
        await bank.transferAmount(this.sender, this.receiver, transferAmount, this.channel, TransferType.TRANSFER);
    }

    protected getComment(): Promise<string> {
        // comments are not currently supported with monetary transfer
        return new Promise((resolve) => resolve(''));
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return BankVisualizer.getCashTransferEmbed(this.sender, this.receiver, amount);
    }
}
