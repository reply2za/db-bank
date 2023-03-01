import { getUserResponse, getUserToTransferTo } from '../../../utils/utils';
import { MessageEventLocal } from '../../../utils/types';
import { Colors, TextChannel } from 'discord.js';
import { BankUser } from '../../../finance/BankUser';
import { BankVisualizer } from '../../../finance/BankVisualizer';
import { bank } from '../../../finance/Bank';
import { localStorage } from '../../../storage/LocalStorage';
import Logger from '../../../utils/Logger';
import { Transfer } from '../../../finance/Transfer';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';

exports.run = async (event: MessageEventLocal) => {
    const recipientBankUser = await getUserToTransferTo(event.message, event.args[1], 'transfer IOUs', event.data);
    if (!recipientBankUser) return;
    await new TransferIOU(<TextChannel>event.message.channel, event.bankUser, recipientBankUser).processTransfer();
};

class TransferIOU extends Transfer {
    constructor(channel: TextChannel, sender: BankUser, receiver: BankUser) {
        super(channel, sender, receiver);
    }

    getTransferEmbed(amount: number, comment: string): EmbedBuilderLocal {
        return BankVisualizer.getIOUTransferEmbed(this.sender, this.receiver, amount, comment);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        const transferResponse = bank.transferIOU(this.sender, this.receiver, transferAmount, comment);
        if (transferResponse.success) {
            await localStorage.saveData(bank.serializeData());
            await this.receiver.getDiscordUser().send({
                embeds: [
                    BankVisualizer.getIOUTransferNotificationEmbed(
                        this.sender.name,
                        this.receiver,
                        transferAmount,
                        comment
                    ).build(),
                ],
            });
            await Logger.transactionLog(
                `[IOU transfer] ${transferAmount} from ${this.sender.name} to ${this.receiver.name}\n` +
                    `comment: ${comment || 'N/A'}`
            );
            await BankVisualizer.getIOUTransferReceiptEmbed(this.receiver.name, transferAmount).send(this.channel);
            return true;
        } else {
            await BankVisualizer.getErrorEmbed(
                `transfer failed: ${transferResponse.failReason || 'unknown reason'}`
            ).send(this.channel);
        }
        return false;
    }
}
