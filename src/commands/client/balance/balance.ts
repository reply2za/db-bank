import { BankVisualizer } from '../../../finance/BankVisualizer';
import { bank } from '../../../finance/Bank';
import { MessageEventLocal } from '../../../utils/types';
import { attachReactionToMessage } from '../../../utils/utils';
import reactions from '../../../utils/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageReaction } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const balanceMsg = await BankVisualizer.showBalance(
        event.message.channel,
        event.bankUser,
        bank.getUserIOUs(event.bankUser.userId)
    );
    let processingReaction = false;
    const reactionsList = [reactions.MONEY, reactions.TICKET];
    const userIOUs = bank.getUserIOUs(event.message.author.id);
    if (userIOUs.length) reactionsList.push(reactions.PAGE_C);
    const balanceReactionCallback = async (reaction: MessageReaction) => {
        reaction.users.remove(event.message.author).catch();
        switch (reaction.emoji.name) {
            case reactions.MONEY:
                await commandHandler.execute({ ...event, statement: 'transfer', args: [] });
                break;
            case reactions.TICKET:
                await commandHandler.execute({ ...event, statement: 'transferiou', args: [] });
                break;
            case reactions.PAGE_C:
                await commandHandler.execute({ ...event, statement: 'iou', args: [] });
                break;
        }
    };
    await attachReactionToMessage(
        balanceMsg,
        [event.message.author],
        reactionsList,
        balanceReactionCallback,
        undefined,
        undefined,
        45000
    );
};
