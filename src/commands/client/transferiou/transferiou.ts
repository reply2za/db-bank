import { getUserToTransferTo } from '../../../utils/utils';
import { MessageEventLocal } from '../../../utils/types';
import { TextChannel } from 'discord.js';
import { bank } from '../../../finance/Bank';
import { localStorage } from '../../../storage/LocalStorage';
import Logger from '../../../utils/Logger';
import { Transfer } from '../../../finance/Transfer';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import iouTransferVisualizer from '../../../finance/visualizers/transfers/iouTransferVisualizer';
import visualizerCommon from '../../../finance/visualizers/visualizerCommon';
import { BankUserCopy } from '../../../finance/BankUser/BankUserCopy';
import { MAX_IOU_COUNT_PER_REQ } from '../../../utils/constants/constants';

exports.run = async (event: MessageEventLocal) => {
    const recipientBankUser = await getUserToTransferTo(event.message, event.args[1], 'transfer IOUs', event.data);
    if (!recipientBankUser) return;
    await new TransferIOU(<TextChannel>event.message.channel, event.bankUser, recipientBankUser).processTransfer();
};

class TransferIOU extends Transfer {
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    getTransferEmbed(amount: number, comment: string): EmbedBuilderLocal {
        return iouTransferVisualizer.getIOUTransferEmbed(this.sender, this.receiver, Math.floor(amount), comment);
    }

    protected async approvedTransactionAction(transferAmount: number, comment: string) {
        transferAmount = Math.floor(transferAmount);
        const transferResponse = bank.transferIOU(
            this.sender.getUserId(),
            this.receiver.getUserId(),
            transferAmount,
            comment
        );
        if (transferResponse.success) {
            await localStorage.saveData(bank.serializeData());
            await this.receiver.getDiscordUser().send({
                embeds: [
                    iouTransferVisualizer
                        .getIOUTransferNotificationEmbed(this.sender.getName(), this.receiver, transferAmount, comment)
                        .build(),
                ],
            });
            await Logger.transactionLog(
                `[IOU transfer] ${transferAmount} IOU${
                    transferAmount === 1 ? '' : 's'
                } from ${this.sender.getName()} to ${this.receiver.getName()}\n` + `comment: ${comment || 'N/A'}`
            );
            await iouTransferVisualizer
                .getIOUTransferReceiptEmbed(this.receiver.getName(), transferAmount)
                .send(this.channel);
            return true;
        } else {
            await visualizerCommon
                .getErrorEmbed(`transfer failed: ${transferResponse.failReason || 'unknown reason'}`)
                .send(this.channel);
        }
        return false;
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        return (
            (await super.validateAmount(transferAmount, channel)) &&
            (() => {
                if (transferAmount > MAX_IOU_COUNT_PER_REQ) {
                    channel.send(`*error: \`cannot send more than ${MAX_IOU_COUNT_PER_REQ} IOUs\`*`);
                    return false;
                }
                return true;
            })()
        );
    }
}
