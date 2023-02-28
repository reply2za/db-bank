import { Colors, TextChannel } from 'discord.js';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { getUserResponse } from '../utils/utils';
import { BankUser } from './BankUser';
import { BankVisualizer } from './BankVisualizer';
import { roundNumberTwoDecimals, validateAmount } from '../utils/numberUtils';
import reactions from '../utils/reactions';

export abstract class Transfer {
    channel;
    sender;
    receiver;
    actionName;
    responder;

    protected constructor(
        channel: TextChannel,
        sender: BankUser,
        receiver: BankUser,
        actionName = 'transfer',
        responder = sender
    ) {
        this.channel = channel;
        this.sender = sender;
        this.receiver = receiver;
        this.actionName = actionName;
        this.responder = responder;
    }

    protected async getAmount() {
        const enterAmountMsg = await new EmbedBuilderLocal()
            .setDescription(`enter the amount you would like to ${this.actionName}`)
            .setFooter('or `q` to quit')
            .send(this.channel);
        const response = await getUserResponse(this.channel, this.responder.userId);
        if (!response) this.channel.send('*no response provided*');
        enterAmountMsg.deletable && enterAmountMsg.delete();
        return response?.content;
    }

    async processTransfer(): Promise<void> {
        let transferEmbed = this.getTransferEmbed(0, '');
        const embedMsg = await transferEmbed.send(this.channel);
        const responseAmt = await this.getAmount();
        if (!responseAmt || responseAmt.toLowerCase() === 'q') {
            await this.cancelResponse();
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
            if (comment.toLowerCase() === 'q') {
                await this.cancelResponse();
                return;
            }
            transferEmbed = this.getTransferEmbed(transferAmount, comment);
            await transferEmbed.edit(embedMsg);
        }
        await BankVisualizer.getConfirmationEmbed(this.actionName).send(this.channel);
        const responseConfirmation = (await getUserResponse(this.channel, this.responder.userId))?.content;
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            await this.approvedTransactionAction(transferAmount, comment);
            embedMsg.react(reactions.CHECK);
        } else {
            await this.cancelResponse();
            embedMsg.react(reactions.X);
        }
    }

    protected abstract getTransferEmbed(number: number, comment: string): EmbedBuilderLocal;

    /**
     * Returning a 'q' (case-insensitive) will cancel the transfer flow.
     * @protected
     */
    protected async getComment(): Promise<string> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);
        return (await getUserResponse(this.channel, this.sender.userId))?.content || '';
    }

    protected abstract approvedTransactionAction(transferAmount: number, comment: string): Promise<void>;

    protected async cancelResponse(): Promise<void> {
        await this.channel.send(`*cancelled ${this.actionName}*`);
    }
}
