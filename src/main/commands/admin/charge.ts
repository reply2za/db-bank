import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { getUserResponse } from '../../utils/utils';
import { TransferType } from '../../finance/types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { Colors, Message, TextChannel } from 'discord.js';
import chargeTransferVisualizer from '../../finance/visualizers/transfers/chargeTransferVisualizer';
import { BankUserCopy } from '../../finance/BankUser/BankUserCopy';
import { ACashTransfer } from '../../finance/Transfer/ACashTransfer';

exports.run = async (event: MessageEventLocal) => {
    const sender = await Charge.getUserToTransferTo(event.message, event.args[0], event.data);
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
}
