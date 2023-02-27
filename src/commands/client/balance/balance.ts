import { BankVisualizer } from '../../../finance/BankVisualizer';
import { bank } from '../../../finance/Bank';
import { MessageEventLocal } from '../../../utils/types';
import { attachReactionToMessage } from '../../../utils/utils';
import reactions from '../../../utils/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageReaction } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';

exports.run = async (event: MessageEventLocal) => {
    const balanceMsg = await BankVisualizer.showBalance(
        event.message.channel,
        event.bankUser,
        bank.getUserIOUs(event.bankUser.userId)
    );
    const reactionsList = [reactions.MONEY, reactions.TICKET];
    const userIOUs = bank.getUserIOUs(event.message.author.id);
    if (userIOUs.length) reactionsList.push(reactions.PAGE_C);
    const balanceReactionCallback = async (reaction: MessageReaction) => {
        reaction.users.remove(event.message.author).catch();
        let transferMsg = event.data.get('INITIAL_TRANSFER_MSG');
        if (transferMsg) {
            transferMsg.delete();
            event.data.delete('REACTION_TSFR_REQ');
            event.data.delete('INITIAL_TRANSFER_MSG');
        }
        let transferReq;
        let cmdName;
        switch (reaction.emoji.name) {
            case reactions.MONEY:
                cmdName = 'transfer';
                break;
            case reactions.TICKET:
                cmdName = 'transferiou';
                break;
            case reactions.PAGE_C:
                cmdName = 'iou';
                break;
            default:
                return;
        }
        // allow the 'view iou' command to be called while a transfer is being initiated
        if (cmdName.includes('transfer')) {
            if (event.data.get('REACTION_TSFR_REQ')) return;
            else {
                transferReq = uuidv4();
                event.data.set('REACTION_TSFR_REQ', transferReq);
            }
        }
        await commandHandler.execute({ ...event, statement: cmdName, args: [] });
        if (event.data.get('REACTION_TSFR_REQ') === transferReq) {
            event.data.delete('REACTION_TSFR_REQ');
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
