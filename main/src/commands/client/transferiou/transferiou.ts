import { MessageEventLocal } from '../../../utils/types';
import { Message, TextChannel } from 'discord.js';
import { bank } from '../../../finance/Bank';
import { localStorage } from '../../../storage/LocalStorage';
import Logger from '../../../utils/Logger';
import { Transfer } from '../../../finance/Transfer';
import EmbedBuilderLocal from '../../../utils/EmbedBuilderLocal';
import iouTransferVisualizer from '../../../finance/visualizers/transfers/iouTransferVisualizer';
import visualizerCommon from '../../../finance/visualizers/visualizerCommon';
import { BankUserCopy } from '../../../finance/BankUser/BankUserCopy';
import { config } from '../../../utils/constants/constants';

exports.run = async (event: MessageEventLocal) => {
    const recipientBankUser = await TransferIOU.getUserToTransferTo(event.message, event.args[0], event.data);
    if (!recipientBankUser) return;
    await new TransferIOU(<TextChannel>event.message.channel, event.bankUser, recipientBankUser).processTransfer();
};

class TransferIOU extends Transfer {
    MINIMUM_TRANSFER_AMT = 1;
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    static getUserToTransferTo(message: Message, name: string, eventData: any): Promise<BankUserCopy | undefined> {
        return super.getUserToTransferTo(message, name, 'transfer IOUs', eventData);
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
                        .getIOUTransferNotificationEmbed(
                            this.sender.getUsername(),
                            this.receiver,
                            transferAmount,
                            comment
                        )
                        .build(),
                ],
            });
            await Logger.transactionLog(
                `[IOU transfer] (${this.sender.getUserId()} -> ${this.receiver.getUserId()})\n` +
                    `${transferAmount} IOU${
                        transferAmount === 1 ? '' : 's'
                    } from ${this.sender.getDBName()} to ${this.receiver.getDBName()}\n` +
                    `comment: ${comment || 'N/A'}\n` +
                    `----------------------------------------`
            );
            await iouTransferVisualizer
                .getIOUTransferReceiptEmbed(this.receiver.getUsername(), transferAmount)
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
                if (Math.floor(transferAmount) !== transferAmount) {
                    channel.send('*error: `cannot send partial IOUs`*');
                    return false;
                }
                if (transferAmount > config.maxIOUCountPerReq) {
                    channel.send(`*error: \`cannot send more than ${config.maxIOUCountPerReq} IOUs\`*`);
                    return false;
                }
                return true;
            })()
        );
    }
}

export default exports;
