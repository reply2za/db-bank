import { Colors, TextChannel } from 'discord.js';
import EmbedBuilderLocal from '../utils/EmbedBuilderLocal';
import { getUserResponse } from '../utils/utils';
import { roundNumberTwoDecimals } from '../utils/numberUtils';
import reactions from '../utils/constants/reactions';
import visualizerCommon from './visualizers/visualizerCommon';
import { BankUserCopy } from './BankUser/BankUserCopy';

const MAX_RETRY_COUNT = 3;
export abstract class Transfer {
    readonly channel;
    readonly sender;
    readonly receiver;
    readonly actionName;
    readonly responder;

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

    async processTransfer(): Promise<void> {
        let transferEmbed = this.getTransferEmbed(0, '');
        let embedMsg = await transferEmbed.send(this.channel);
        let retries = MAX_RETRY_COUNT;
        let transferAmount;
        let isValid;
        do {
            const responseAmt = await this.getAmount();
            if (!responseAmt || responseAmt.toLowerCase() === 'q') {
                await this.cancelResponse();
                embedMsg.deletable && embedMsg.delete();
                return;
            }
            transferAmount = roundNumberTwoDecimals(Number(responseAmt));
            isValid = await this.validateAmount(transferAmount, this.channel);
            retries--;
        } while (retries > 0 && !isValid);
        if (!isValid || !transferAmount) {
            embedMsg.deletable && embedMsg.delete();
            return;
        }
        transferEmbed = this.getTransferEmbed(transferAmount, '');
        await transferEmbed.edit(embedMsg);
        const comment = await this.getComment();
        if (comment === undefined || comment.toLowerCase() === 'q') {
            await this.cancelResponse(comment === undefined ? 'no response provided' : '');
            embedMsg.react(reactions.X);
            return;
        }
        if (comment !== '') {
            transferEmbed = this.getTransferEmbed(transferAmount, comment);
        }
        await embedMsg.delete();
        embedMsg = await transferEmbed.send(this.channel);
        const confirmationResponse = await this.getFinalConfirmation();
        if (confirmationResponse) {
            const txnResponse = await this.approvedTransactionAction(transferAmount, comment);
            embedMsg.react(txnResponse ? reactions.CHECK : reactions.X);
        } else {
            await this.cancelResponse();
            embedMsg.react(reactions.X);
        }
    }

    /**
     * Prompts the user to enter an amount.
     * @protected
     */
    protected async getAmount(): Promise<string | undefined> {
        const enterAmountMsg = await new EmbedBuilderLocal()
            .setDescription(`enter the amount you would like to ${this.actionName}`)
            .setFooter('or `q` to quit')
            .send(this.channel);
        const response = await getUserResponse(this.channel, this.responder.getUserId());
        if (!response) this.channel.send('*no response provided*');
        enterAmountMsg.deletable && enterAmountMsg.delete();
        return response?.content;
    }

    protected async getFinalConfirmation(): Promise<boolean> {
        await visualizerCommon.getConfirmationEmbed(this.actionName).send(this.channel);
        const responseConfirmation = (await getUserResponse(this.channel, this.responder.getUserId()))?.content;
        return responseConfirmation?.toLowerCase() === 'yes';
    }

    /**
     * Returning a 'q' (case-insensitive) allows users to cancel the transfer flow.
     * Returning undefined means user-abandoned and will also cancel the flow.
     * @protected
     */
    protected async getComment(): Promise<string | undefined> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);
        return (await getUserResponse(this.channel, this.sender.getUserId()))?.content;
    }

    protected async cancelResponse(reason = ''): Promise<void> {
        await this.channel.send(`*cancelled ${this.actionName}${reason ? `: ${reason}` : ''}*`);
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!Number.isFinite(transferAmount)) {
            await channel.send('*error: `invalid input`*');
            return false;
        }
        if (transferAmount <= 0) {
            await channel.send('*error: `amount must be greater than 0`*');
            return false;
        }
        return true;
    }

    /**
     * The transfer embed to show during the transfer process.
     * @param number A user provided amount to transfer.
     * @param comment A user provided comment for the transfer.
     * @protected
     */
    protected abstract getTransferEmbed(number: number, comment: string): EmbedBuilderLocal;

    /**
     * The action to perform if the user wishes to continue with the transaction after the confirmation page.
     * @param transferAmount The amount to transfer
     * @param comment A user comment associated with this transaction.
     * @protected
     * @returns Whether the transaction succeeded.
     */
    protected abstract approvedTransactionAction(transferAmount: number, comment: string): Promise<boolean>;
}
