import { BankVisualizer } from '../../../finance/BankVisualizer';
import { bank } from '../../../finance/Bank';
import { MessageEventLocal } from '../../../utils/types';
import { attachReactionToMessage } from '../../../utils/utils';
import reactions from '../../../utils/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';

exports.run = async (event: MessageEventLocal) => {
    const balanceMsg = await BankVisualizer.showBalance(
        event.message.channel,
        event.bankUser,
        bank.getUserIOUs(event.bankUser.userId)
    );
    let processingReaction = false;
    await attachReactionToMessage(
        balanceMsg,
        [event.message.author],
        [reactions.MONEY, reactions.TICKET],
        async (reaction) => {
            if (processingReaction) return;
            processingReaction = true;
            switch (reaction.emoji.name) {
                case reactions.MONEY:
                    await commandHandler.execute({ ...event, statement: 'transfer' });
                    break;
                case reactions.TICKET:
                    await commandHandler.execute({ ...event, statement: 'transferiou' });
                    break;
            }
            processingReaction = false;
        }
    );
};
