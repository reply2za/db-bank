import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { getUserResponse, getUserToTransferTo } from '../../utils/utils';
import { TransferType } from '../../finance/types';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { Colors, TextChannel } from 'discord.js';
import { Transfer } from '../../finance/Transfer';
import { BankUser } from '../../finance/BankUser';
import chargeTransferVisualizer from '../../finance/visualizers/transfers/chargeTransferVisualizer';

exports.run = async (event: MessageEventLocal) => {
    const sender = await getUserToTransferTo(event.message, event.args[1], 'charge');
    if (!sender) return;
    await new Charge(<TextChannel>event.message.channel, sender, event.bankUser, 'charge').processTransfer();
};

class Charge extends Transfer {
    constructor(channel: TextChannel, sender: BankUser, receiver: BankUser, actionName: string) {
        super(channel, sender, receiver, actionName, receiver);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        const status = await bank.transferAmount(
            this.sender,
            this.receiver,
            transferAmount,
            this.channel,
            TransferType.CHARGE,
            comment
        );
        return status.success;
    }

    protected async getComment(): Promise<string> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['b' = blank, 'q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);

        const commentResponse = (await getUserResponse(this.channel, this.receiver.userId))?.content || '';
        if (commentResponse === 'b') return '';
        return commentResponse;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return chargeTransferVisualizer.getChargeTransferEmbed(this.sender, this.receiver, amount, comment);
    }
}
