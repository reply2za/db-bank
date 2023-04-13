import { Colors, Message, TextChannel } from 'discord.js';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { attachReactionToMessage, getUserResponse } from '../../utils/utils';
import { roundNumberTwoDecimals } from '../../utils/numberUtils';
import reactions from '../../utils/constants/reactions';
import visualizerCommon from '../visualizers/visualizerCommon';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { EventDataNames } from '../../utils/types';
import { config } from '../../utils/constants/constants';
import { TransferType } from '../types';
import { bankUserLookup } from '../BankUserLookup';
import logger from '../../utils/Logger';

const MAX_RETRY_COUNT = 3;

export abstract class Transfer {
    readonly channel;
    readonly sender;
    readonly receiver;
    readonly transferType;
    readonly responder;
    // the minimum amount that can be transferred
    protected MINIMUM_TRANSFER_AMT = 0.01;
    // the comment prompt sent to the user
    private commentMsg: Message | undefined;

    protected constructor(
        channel: TextChannel,
        sender: BankUserCopy,
        receiver: BankUserCopy,
        transferType = TransferType.TRANSFER,
        responder = sender
    ) {
        this.channel = channel;
        this.sender = sender;
        this.receiver = receiver;
        this.transferType = transferType;
        this.responder = responder;
    }

    /**
     * Searches the message for a mention. If there is none then searches the name. If there is no name then prompts the author.
     * @param message The author's message.
     * @param name Optional - A name of a author to search for.
     * @param actionName Optional - The name of the action that is being attempted
     * @param eventData Optional - Event data
     * @returns The BankUser to transfer to or undefined if the request failed or was cancelled.
     */
    static async getUserToTransferTo(
        message: Message,
        name = '',
        actionName = 'transfer',
        eventData = new Map<EventDataNames, any>()
    ): Promise<BankUserCopy | undefined> {
        const recipientDetails = await Transfer.promptForRecipient(message, name, actionName, eventData);
        if (!recipientDetails) return;
        const bankUserOrErr = await Transfer.resolveBankUser(
            recipientDetails.recipientID,
            recipientDetails.recipientName
        );
        if (typeof bankUserOrErr === 'string') {
            message.channel.send(bankUserOrErr);
            return;
        }
        if (bankUserOrErr.getUserId() === message.author.id && !config.adminIDs.includes(`${message.author.id} `)) {
            message.channel.send(`you cannot make a ${actionName} to yourself`);
        }
        return bankUserOrErr;
    }

    async processTransfer(transferAmount: number | undefined = 0, comment: string | undefined = ''): Promise<Transfer> {
        let transferEmbed = this.getTransferEmbed(transferAmount, comment);
        let embedMsg = await transferEmbed.send(this.channel);
        if (!transferAmount) {
            transferAmount = await this.getAmount();
            if (!transferAmount) {
                await this.cancelResponse();
                if (embedMsg.deletable) await embedMsg.delete();
                return this;
            }
        }
        transferEmbed = this.getTransferEmbed(transferAmount, '');
        await transferEmbed.edit(embedMsg);
        let newTransfer;
        if (!comment) {
            const reactionCollector = await this.attachUndoReaction(embedMsg, () => {
                this.channel.send('*resetting amount*');
                newTransfer = this.processTransfer();
                if (this.commentMsg && this.commentMsg.deletable) this.commentMsg.delete();
                if (embedMsg.deletable) embedMsg.delete();
            });
            comment = await this.getComment();
            if (newTransfer) return newTransfer;
            reactionCollector.stop();
            if (comment === undefined || comment.toLowerCase() === 'q') {
                await this.cancelResponse(comment === undefined ? 'no response provided' : '');
                embedMsg.react(reactions.X).catch((e) => logger.debugLog(e));
                return this;
            }
            if (comment !== '') {
                transferEmbed = this.getTransferEmbed(transferAmount, comment);
            }
        }
        await embedMsg.delete();
        embedMsg = await transferEmbed.send(this.channel);
        const reactionCollector = await this.attachUndoReaction(embedMsg, () => {
            this.channel.send('*resetting comment*');
            newTransfer = this.processTransfer(transferAmount);
            if (this.commentMsg && this.commentMsg.deletable) this.commentMsg.delete();
            if (embedMsg.deletable) embedMsg.delete();
        });
        const confirmationResponse = await this.getFinalConfirmation();
        if (newTransfer) return newTransfer;
        reactionCollector.stop();
        if (confirmationResponse) {
            const txnResponse = await this.approvedTransactionAction(transferAmount, comment);
            embedMsg.react(txnResponse ? reactions.CHECK : reactions.X).catch((e) => logger.debugLog(e));
        } else {
            await this.cancelResponse();
            embedMsg.react(reactions.X).catch((e) => logger.debugLog(e));
        }
        return this;
    }

    /**
     * Process of getting the amount.
     * @returns The transfer amount if successful or undefined if unsuccessful.
     */
    protected async getAmount(): Promise<number | undefined> {
        let retries = MAX_RETRY_COUNT;
        let transferAmount;
        let isValid;
        do {
            const responseAmt = await this.promptForAmount();
            if (!responseAmt || responseAmt.toLowerCase() === 'q') return;
            transferAmount = roundNumberTwoDecimals(Number(responseAmt));
            isValid = await this.validateAmount(transferAmount, this.channel);
            retries--;
        } while (retries > 0 && !isValid);
        if (!isValid) return;
        return transferAmount;
    }

    /**
     * Prompts the author to enter an amount.
     * @protected
     */
    protected async promptForAmount(): Promise<string | undefined> {
        const enterAmountMsg = await new EmbedBuilderLocal()
            .setDescription(`enter the amount you would like to ${this.transferType}`)
            .setFooter('or `q` to quit')
            .send(this.channel);
        const response = await getUserResponse(this.channel, this.responder.getUserId());
        if (!response) this.channel.send('*no response provided*');
        if (enterAmountMsg.deletable) await enterAmountMsg.delete();
        return response?.content;
    }

    protected async getFinalConfirmation(): Promise<boolean> {
        await visualizerCommon.getConfirmationEmbed(this.transferType).send(this.channel);
        const responseConfirmation = (await getUserResponse(this.channel, this.responder.getUserId()))?.content;
        return responseConfirmation?.toLowerCase() === 'yes';
    }

    /**
     * Sends the comment prompt to the author.
     * @protected
     */
    protected sendCommentPrompt(): Promise<Message> {
        return new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);
    }

    /**
     * Gets the response message from the author and returns the comment.
     * Returning a 'q' (case-insensitive) allows users to cancel the transfer flow.
     * Returning undefined means author-abandoned and will also cancel the flow.
     * @protected
     */
    protected async getUserComment(): Promise<string | undefined> {
        return (await getUserResponse(this.channel, this.sender.getUserId()))?.content;
    }

    protected async cancelResponse(reason = ''): Promise<void> {
        await this.channel.send(`*cancelled ${this.transferType}${reason ? `: ${reason}` : ''}*`);
    }

    protected async validateAmount(transferAmount: number, channel: TextChannel): Promise<boolean> {
        if (!Number.isFinite(transferAmount)) {
            await channel.send('*error: `invalid input`*');
            return false;
        }
        if (transferAmount < this.MINIMUM_TRANSFER_AMT) {
            await channel.send(`*error: \`amount must be greater than or equal to ${this.MINIMUM_TRANSFER_AMT}\`*`);
            return false;
        }
        return true;
    }

    /**
     * The transfer embed to show during the transfer process.
     * @param number A author provided amount to transfer.
     * @param comment A author provided comment for the transfer.
     * @protected
     */
    protected abstract getTransferEmbed(number: number, comment: string): EmbedBuilderLocal;

    /**
     * The action to perform if the author wishes to continue with the transaction after the confirmation page.
     * @param transferAmount The amount to transfer
     * @param comment A author comment associated with this transaction.
     * @protected
     * @returns Whether the transaction succeeded.
     */
    protected abstract approvedTransactionAction(transferAmount: number, comment: string): Promise<boolean>;

    private static async promptForRecipient(
        message: Message,
        name = '',
        actionName = 'transfer',
        eventData = new Map<EventDataNames, any>()
    ): Promise<{ recipientID?: string; recipientName?: string } | undefined> {
        let recipientID = message.mentions?.users.first()?.id;
        if (!name && !recipientID) {
            const initialTransferMsg = await message.channel.send(
                `Who you would like to ${actionName} to? *['q' = cancel]*`
            );
            eventData.set(EventDataNames.INITIAL_TRANSFER_MSG, initialTransferMsg);
            const newMsg = await getUserResponse(message.channel, message.author.id);
            // determines if abandoned, meaning that the same transfer is no longer active
            if (initialTransferMsg.id !== eventData.get(EventDataNames.INITIAL_TRANSFER_MSG)?.id) return;
            eventData.delete(EventDataNames.INITIAL_TRANSFER_MSG);
            if (!newMsg) {
                message.channel.send('*no response provided*');
                return;
            }
            recipientID = newMsg?.mentions?.users.first()?.id;
            if (!recipientID) {
                if (newMsg.content) {
                    if (newMsg.content.toLowerCase() === 'q') {
                        message.channel.send('*cancelled*');
                        return;
                    } else {
                        name = newMsg.content.split(' ')[0];
                    }
                } else {
                    message.channel.send(`must specify user to ${actionName} to`);
                    return;
                }
            }
        }
        return { recipientID, recipientName: name };
    }

    /**
     * Determines if a unique author can be found from the given parameters.
     * @param recipientID
     * @param recipientName
     * @private
     * @returns The author if found, otherwise a string with an error message.
     */
    private static async resolveBankUser(recipientID = '', recipientName = ''): Promise<BankUserCopy | string> {
        let recipientBankUser;
        if (recipientID) {
            recipientBankUser = bankUserLookup.getUser(recipientID);
        } else if (recipientName) {
            const matchingUsers = bankUserLookup.findUser(recipientName);
            if (
                matchingUsers.length > 1 &&
                matchingUsers[0].getUsername().toLowerCase() === matchingUsers[1].getUsername().toLowerCase()
            ) {
                return '*multiple users have that name, use @ mentions or try again with the author id (name#1234)*';
            }
            recipientBankUser = matchingUsers[0];
        }
        if (!recipientBankUser) {
            const displayName = recipientName.length < 30 ? recipientName : `${recipientName.substring(0, 30)}...`;
            return `*could not find user **${displayName}**, try using @ mentions or the user id (name#1234)*`;
        }
        return recipientBankUser;
    }

    /**
     * Returning a 'q' (case-insensitive) allows users to cancel the transfer flow.
     * Returning undefined means author-abandoned and will also cancel the flow.
     * @protected
     */
    private async getComment(): Promise<string | undefined> {
        this.commentMsg = await this.sendCommentPrompt();
        return await this.getUserComment();
    }

    private attachUndoReaction = async (msg: Message, callback: () => void) => {
        return await attachReactionToMessage(
            msg,
            [this.responder.getUserId()],
            [reactions.ARROW_L],
            (react, user, collector) => {
                collector.stop();
                if (react.emoji.name === reactions.ARROW_L) {
                    callback();
                }
            }
        );
    };
}
