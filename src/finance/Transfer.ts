import { Colors, TextChannel } from 'discord.js';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { getUserResponse } from '../utils/utils';
import { roundNumberTwoDecimals } from '../utils/numberUtils';
import reactions from '../utils/constants/reactions';
import visualizerCommon from './visualizers/visualizerCommon';
import { BankUserCopy } from './BankUser/BankUserCopy';

export abstract class Transfer {
    channel;
    sender;
    receiver;
    actionName;
    responder;

    protected constructor(
        channel: TextChannel,
        sender: BankUserCopy,
        receiver: BankUserCopy,
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
        const response = await getUserResponse(this.channel, this.responder.getUserId());
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
        const isValid = await this.validateAmount(transferAmount, this.channel);
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
                embedMsg.react(reactions.X);
                return;
            }
            transferEmbed = this.getTransferEmbed(transferAmount, comment);
            await transferEmbed.edit(embedMsg);
        }
        await visualizerCommon.getConfirmationEmbed(this.actionName).send(this.channel);
        const responseConfirmation = (await getUserResponse(this.channel, this.responder.getUserId()))?.content;
        if (responseConfirmation && responseConfirmation.toLowerCase() === 'yes') {
            const txnResponse = await this.approvedTransactionAction(transferAmount, comment);
            embedMsg.react(txnResponse ? reactions.CHECK : reactions.X);
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
        return (await getUserResponse(this.channel, this.sender.getUserId()))?.content || '';
    }

    /**
     * The action to perform if the user wishes to continue with the transaction after the confirmation page.
     * @param transferAmount The amount to transfer
     * @param comment A user comment associated with this transaction.
     * @protected
     * @returns Whether the transaction succeeded.
     */
    protected abstract approvedTransactionAction(transferAmount: number, comment: string): Promise<boolean>;

    protected async cancelResponse(): Promise<void> {
        await this.channel.send(`*cancelled ${this.actionName}*`);
    }

    private async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!Number.isFinite(transferAmount)) {
            await channel.send('*cancelled transfer: `invalid input`*');
            return false;
        }
        if (transferAmount <= 0) {
            await channel.send('*cancelled transfer: `amount must be greater than 0`*');
            return false;
        }
        return true;
    }
}
