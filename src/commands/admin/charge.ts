import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { getUserResponse } from '../../utils/utils';
import { TransferType } from '../../finance/types';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { Colors, Message, TextChannel } from 'discord.js';
import { Transfer } from '../../finance/Transfer';
import chargeTransferVisualizer from '../../finance/visualizers/transfers/chargeTransferVisualizer';
import { BankUserCopy } from '../../finance/BankUser/BankUserCopy';

exports.run = async (event: MessageEventLocal) => {
    const sender = await Charge.getUserToTransferTo(event.message, event.args[1], event.data);
    if (!sender) return;
    await new Charge(<TextChannel>event.message.channel, sender, event.bankUser).processTransfer();
};

class Charge extends Transfer {
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

    protected async getComment(): Promise<string | undefined> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['b' = blank, 'q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);

        const commentResponse = (await getUserResponse(this.channel, this.receiver.getUserId()))?.content;
        if (commentResponse?.toLowerCase() === 'b') return '';
        return commentResponse;
    }

    getTransferEmbed(amount: number, comment = ''): EmbedBuilderLocal {
        return chargeTransferVisualizer.getChargeTransferEmbed(this.sender, this.receiver, amount, comment);
    }

    protected async promptForAmount(): Promise<string | undefined> {
        let amt = await super.promptForAmount();
        if (amt) {
            if (amt.charAt(0) === '$') amt = amt.replace('$', '');
            amt = amt.replaceAll(',', '');
        }
        return amt;
    }
}
