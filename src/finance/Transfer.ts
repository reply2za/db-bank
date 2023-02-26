import { TextChannel } from 'discord.js';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { getUserResponse } from '../utils/utils';
import { BankUser } from './BankUser';
import { BankVisualizer } from './BankVisualizer';
import { roundNumberTwoDecimals, validateAmount } from '../utils/numberUtils';

export abstract class Transfer {
    channel;
    sender;
    receiver;

    protected constructor(channel: TextChannel, sender: BankUser, receiver: BankUser) {
        this.channel = channel;
        this.sender = sender;
        this.receiver = receiver;
    }

    protected async getAmount(senderId: string) {
        const enterAmountMsg = await new EmbedBuilderLocal()
            .setDescription('enter the amount you would like to send')
            .setFooter('or `q` to quit')
            .send(this.channel);
        const response = await getUserResponse(this.channel, senderId);
        enterAmountMsg.deletable && enterAmountMsg.delete();
        return response?.content;
    }

    async processTransfer(): Promise<void> {
        let transferEmbed = this.getTransferEmbed(0, '');
        const embedMsg = await transferEmbed.send(this.channel);
        const responseAmt = await this.getAmount(this.sender.userId);
        if (!responseAmt || responseAmt.toLowerCase() === 'q') {
            this.channel.send('*cancelled transfer*');
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        const transferAmount = roundNumberTwoDecimals(Number(responseAmt));
        const isValid = validateAmount(transferAmount, this.channel);
        if (!isValid) {
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        transferEmbed = this.getTransferEmbed(transferAmount, '');
        await transferEmbed.edit(embedMsg);
        const comment = await this.getComment();
        if (comment) {
            transferEmbed = this.getTransferEmbed(transferAmount, comment);
            await transferEmbed.edit(embedMsg);
        }
        await BankVisualizer.getConfirmationEmbed('transfer').send(this.channel);
        const responseConfirmation = (await getUserResponse(this.channel, this.sender.userId))?.content;
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            await this.approvedTransactionAction(transferAmount, comment);
        } else {
            await this.channel.send('*cancelled transfer*');
        }
    }
    protected abstract getTransferEmbed(number: number, comment: string): EmbedBuilderLocal;

    protected abstract getComment(): Promise<string>;

    protected abstract approvedTransactionAction(transferAmount: number, comment: string): Promise<void>;
}
