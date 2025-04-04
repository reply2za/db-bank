import { Colors, Message, ReactionCollector, TextBasedChannel, TextChannel } from 'discord.js';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { formatErrorText, getUserResponse } from '../../utils/utils';
import { roundNumberTwoDecimals } from '../../utils/numberUtils';
import reactions from '../../utils/constants/reactions';
import visualizerCommon from '../visualizers/visualizerCommon';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { EventDataNames, MessageChannel } from '../../utils/types';
import { config, djsCommonUtils } from '../../utils/constants/constants';
import { TransferType } from '../types';
import { bankUserLookup } from '../BankUserLookup';
import logger from '../../utils/Logger';
import Logger from '../../utils/Logger';
import { processManager } from '../../utils/ProcessManager';
import { ABankUser } from '../BankUser/ABankUser';

const MAX_RETRY_COUNT = 3;
const USER_SELECT_REACTIONS = [reactions.ONE, reactions.TWO];
const USER_SELECT_REACTION_TIMEOUT_MS = 60000;

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
        channel: MessageChannel,
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
     * @param bankUser The bank user
     * @param channel The channel
     * @param message The author's message.
     * @param name Optional - A name of an author to search for.
     * @param actionName Optional - The name of the action that is being attempted.
     * @param eventData Optional - Event data.
     * @returns The BankUser to transfer to or undefined if the request failed or was cancelled.
     */
    static async getUserToTransferTo(
        bankUser: ABankUser,
        channel: MessageChannel,
        name = '',
        message?: Message,
        eventData = new Map<EventDataNames, any>(),
        actionName = 'transfer'
    ): Promise<BankUserCopy | undefined> {
        let recipientDetails;
        recipientDetails = await Transfer.promptForRecipient(channel, bankUser, name, actionName, message, eventData);
        if (!recipientDetails) return;
        const bankUserOrErr = await Transfer.resolveBankUser(
            recipientDetails.recipientID,
            recipientDetails.recipientName
        );
        if (typeof bankUserOrErr === 'string') {
            (<TextChannel>channel).send(bankUserOrErr);
            return;
        }
        if (bankUserOrErr.getUserId() === bankUser.getUserId() && !config.adminIDs.includes(`${bankUser.id} `)) {
            (<TextChannel>channel).send(`you cannot make a ${actionName} to yourself`);
        }
        return bankUserOrErr;
    }

    static printUserHistory(history: string[] | undefined): string {
        if (history && history.length > 0) {
            let user1 = bankUserLookup.getUser(history[history.length - 1])?.getDiscordUser().username;
            let user2 =
                history.length > 1
                    ? bankUserLookup.getUser(history[history.length - 2])?.getDiscordUser().username
                    : undefined;
            let counter = 1;
            let pastUsers = [user1, user2]
                .filter((u) => u)
                .map((u) => `${USER_SELECT_REACTIONS[counter++ - 1]} \`${u}\``);
            let userLen = pastUsers.length;
            let userNumDesc = userLen > 1 ? `${userLen} users` : 'user';
            return `The last ${userNumDesc} you've transferred to:` + '\n' + pastUsers.join('\n&\n') + '\n';
        }
        return '';
    }

    /**
     * Processes a transfer.
     * @param transferAmount The amount to transfer. If undefined or 0 then the user will be prompted for an amount.
     * @param comment A comment for the transfer. Only an undefined comment will prompt the user for a comment.
     */
    async processTransfer(
        transferAmount: number | undefined = 0,
        comment: string | undefined = undefined
    ): Promise<Transfer> {
        let transferEmbed = this.getTransferEmbed(transferAmount, comment ?? '');
        // the message containing the main transfer interface
        let embedMsg = await transferEmbed.send(this.channel);
        if (!transferAmount) {
            transferAmount = await this.getAmount();
            if (!transferAmount) {
                await this.cancelResponse();
                if (embedMsg.deletable) await embedMsg.delete();
                return this;
            }
        } else if (!(await this.validateAmount(transferAmount, this.channel))) {
            await this.cancelResponse();
            if (embedMsg.deletable) await embedMsg.delete();
            return this;
        }
        transferEmbed = this.getTransferEmbed(transferAmount, comment || '');
        await transferEmbed.edit(embedMsg);
        let newTransfer;
        if (comment === undefined) {
            const reactionCollector = await this.attachUndoReaction(embedMsg, async () => {
                await (<TextChannel>this.channel).send('*resetting amount*');
                newTransfer = this.processTransfer();
                if (this.commentMsg && this.commentMsg.deletable) await this.commentMsg.delete();
                if (embedMsg.deletable) await embedMsg.delete();
            });
            comment = await this.getComment();
            if (newTransfer) return newTransfer;
            reactionCollector.stop();
            if (comment === undefined || comment.toLowerCase() === 'q') {
                await this.cancelResponse(comment === undefined ? 'no response provided' : '');
                embedMsg.react(reactions.X).catch((e) => logger.debugLog(e));
                return this;
            }
            if (comment) {
                transferEmbed = this.getTransferEmbed(transferAmount, comment);
            }
        }
        embedMsg.deletable && (await embedMsg.delete());
        embedMsg = await transferEmbed.send(this.channel);
        const reactionCollector = await this.attachUndoReaction(embedMsg, async () => {
            await (<TextChannel>this.channel).send('*resetting comment*');
            newTransfer = this.processTransfer(transferAmount);
            if (this.commentMsg && this.commentMsg.deletable) await this.commentMsg.delete();
            if (embedMsg.deletable) await embedMsg.delete();
        });
        const confirmationResponse = await this.getFinalConfirmation();
        if (newTransfer) return newTransfer;
        reactionCollector.stop();
        if (confirmationResponse) {
            const txnResponse = await this.approvedTransactionAction(transferAmount, comment);
            if (txnResponse) {
                try {
                    await this.postSuccessfulTransferAction(
                        this.sender,
                        this.receiver,
                        transferAmount,
                        comment,
                        this.channel
                    );
                } catch (e: any) {
                    await (<TextChannel>this.channel).send(formatErrorText(e.message));
                    await logger.debugLog(e);
                }
                await embedMsg.react(reactions.CHECK);
            } else {
                await embedMsg.react(reactions.X);
            }
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
        if (!response) (<TextChannel>this.channel).send('*no response provided*');
        if (enterAmountMsg.deletable) await enterAmountMsg.delete();
        return response?.content;
    }

    protected async getFinalConfirmation(): Promise<boolean> {
        await visualizerCommon.getConfirmationEmbed(this.transferType).send(this.channel);
        const responseConfirmation = (await getUserResponse(this.channel, this.responder.getUserId()))?.content;
        return responseConfirmation?.toLowerCase() === 'yes';
    }

    /**
     * Returning a 'q' (case-insensitive) allows users to cancel the transfer flow.
     * Returning undefined means author-abandoned and will also cancel the flow.
     * @protected
     */
    protected async getComment(): Promise<string | undefined> {
        this.commentMsg = await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);
        return (await getUserResponse(this.channel, this.sender.getUserId()))?.content;
    }

    protected async cancelResponse(reason = ''): Promise<void> {
        await (<TextChannel>this.channel).send(`*cancelled ${this.transferType}${reason ? `: ${reason}` : ''}*`);
    }

    protected async validateAmount(transferAmount: number, channel: MessageChannel): Promise<boolean> {
        if (!Number.isFinite(transferAmount)) {
            await (<TextChannel>channel).send(formatErrorText('invalid input'));
            return false;
        }
        if (transferAmount < this.MINIMUM_TRANSFER_AMT) {
            await (<TextChannel>channel).send(
                formatErrorText(`amount must be greater than or equal to ${this.MINIMUM_TRANSFER_AMT}`)
            );
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

    /**
     * The action to perform after a successful transfer.
     * @param sender The sender of the transfer.
     * @param receiver The receiver of the transfer.
     * @param transferAmount The amount transferred.
     * @param comment A comment associated with the transfer.
     * @param channel The channel the transfer was initiated in.
     * @protected
     */
    protected abstract postSuccessfulTransferAction(
        sender: BankUserCopy,
        receiver: BankUserCopy,
        transferAmount: number,
        comment: string,
        channel: MessageChannel
    ): Promise<void>;

    private static async promptForRecipient(
        channel: TextBasedChannel,
        bankUser: ABankUser,
        name = '',
        actionName = 'transfer',
        message?: Message,
        eventData = new Map<EventDataNames, any>()
    ): Promise<{ recipientID?: string; recipientName?: string } | undefined> {
        return new Promise(async (resolve, reject) => {
            let recipientID = message?.mentions?.users.first()?.id;
            if (!name && !recipientID) {
                let historyList: string[] | undefined = eventData.get(EventDataNames.AUTHOR_INTERACT_HISTORY);
                let historyMsg = this.printUserHistory(historyList);
                const initialTransferMsg = await new EmbedBuilderLocal()
                    .setDescription(
                        `${historyMsg}Type a username ${
                            historyList?.length ? '(or select a reaction)' : ''
                        } to ${actionName} *['q' = cancel]*`
                    )
                    .send(channel);

                eventData.set(EventDataNames.INITIAL_TRANSFER_MSG, initialTransferMsg);
                const reactList = [];
                if (historyList && historyList.length) {
                    reactList.push(reactions.ONE);
                    if (historyList.length > 1) {
                        reactList.push(reactions.TWO);
                    }
                    reactList.push(reactions.X);
                }
                let collector: ReactionCollector | undefined;
                let isStopped = false;
                if (reactList.length) {
                    djsCommonUtils
                        .attachReactionsToMessage(
                            initialTransferMsg,
                            [bankUser.getUserId()],
                            reactList,
                            (react) => {
                                if (!historyList) return;
                                if (initialTransferMsg.id !== eventData.get(EventDataNames.INITIAL_TRANSFER_MSG)?.id)
                                    return;
                                if (react.emoji.name === reactions.ONE) {
                                    resolve({ recipientID: historyList[historyList.length - 1] });
                                    processManager.removeUserResponseLock(bankUser.getUserId(), channel.id.toString());
                                    if (collector) collector.stop('reacted');
                                    return;
                                } else if (react.emoji.name === reactions.TWO && historyList.length > 1) {
                                    if (collector) collector.stop('reacted');
                                    resolve({ recipientID: historyList[historyList.length - 2] });
                                    processManager.removeUserResponseLock(bankUser.getUserId(), channel.id.toString());
                                    return;
                                } else if (react.emoji.name === reactions.X) {
                                    (<TextChannel>channel).send('*cancelled*');
                                    resolve(undefined);
                                    processManager.removeUserResponseLock(bankUser.getUserId(), channel.id.toString());
                                    if (collector) collector.stop('user cancelled');
                                    return;
                                }
                            },
                            (_collected, reason) => {
                                if (reason != 'messageDelete') {
                                    initialTransferMsg.reactions
                                        .removeAll()
                                        .catch((e) => logger.debugLog(e, 'initial_message_reactions_remove_error'));
                                    if (reason === 'reacted') {
                                        eventData.delete(EventDataNames.INITIAL_TRANSFER_MSG);
                                        initialTransferMsg.deletable && initialTransferMsg.delete();
                                    }
                                }
                            },
                            undefined,
                            USER_SELECT_REACTION_TIMEOUT_MS
                        )
                        .then((result) => {
                            collector = result;
                            if (isStopped) collector.stop();
                        })
                        .catch((e) => Logger.debugLog(e));
                }
                const newMsg = await getUserResponse(channel, bankUser.getUserId());
                collector?.stop();
                isStopped = true;
                // determines if abandoned, meaning that the same transfer is no longer active
                if (initialTransferMsg.id !== eventData.get(EventDataNames.INITIAL_TRANSFER_MSG)?.id) {
                    resolve(undefined);
                    return;
                }
                eventData.delete(EventDataNames.INITIAL_TRANSFER_MSG);
                if (!newMsg) {
                    (<TextChannel>channel).send('*no response provided*');
                    resolve(undefined);
                    return;
                }
                recipientID = newMsg?.mentions?.users.first()?.id;
                if (!recipientID) {
                    if (newMsg.content) {
                        if (newMsg.content.toLowerCase() === 'q') {
                            (<TextChannel>channel).send('*cancelled*');
                            resolve(undefined);
                            return;
                        } else {
                            name = newMsg.content;
                        }
                    } else {
                        (<TextChannel>channel).send(`must specify user to ${actionName} to`);
                        resolve(undefined);
                        return;
                    }
                }
            }
            resolve({ recipientID, recipientName: name });
        });
    }

    /**
     * Determines if a unique author can be found from the given parameters.
     * Provide either a recipientID or recipientName.
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

    private attachUndoReaction = async (msg: Message, callback: () => void) => {
        return djsCommonUtils.attachReactionsToMessage(
            msg,
            [this.responder.getUserId()],
            [reactions.ARROW_L],
            async (react, _user, collector) => {
                collector.stop();
                if (react.emoji.name === reactions.ARROW_L) {
                    callback();
                }
            }
        );
    };
}
