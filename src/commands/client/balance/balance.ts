import { bank } from '../../../finance/Bank';
import { MessageEventLocal } from '../../../utils/types';
import { attachReactionToMessage } from '../../../utils/utils';
import reactions from '../../../utils/constants/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageReaction } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import visualizerCommon from '../../../finance/visualizers/visualizerCommon';

exports.run = async (event: MessageEventLocal) => {
    const balanceMsg = await visualizerCommon.showBalance(
        event.message.channel,
        event.bankUser,
        bank.getUserIOUs(event.bankUser.userId)
    );
    const reactionsList = [reactions.MONEY, reactions.TICKET];
    const userIOUs = bank.getUserIOUs(event.message.author.id);
    if (userIOUs.length) reactionsList.push(reactions.PAGE_C);
    const balanceReactionCallback = async (reaction: MessageReaction) => {
        reaction.users.remove(event.message.author).catch();
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
        let transferMsg = event.data.get('INITIAL_TRANSFER_MSG');
        if (transferMsg) {
            const activeTransferReq = event.data.get('REACTION_TSFR_REQ');
            if (activeTransferReq?.cmdName !== cmdName) {
                transferMsg.delete();
                event.data.delete('INITIAL_TRANSFER_MSG');
                event.data.delete('REACTION_TSFR_REQ');
            }
        }
        // a unique id for the transfer request
        let transferRequestId;
        // allow the 'view iou' command to be called while a transfer is being initiated
        if (cmdName.includes('transfer')) {
            if (event.data.get('REACTION_TSFR_REQ')) {
                return;
            } else {
                transferRequestId = uuidv4();
                event.data.set('REACTION_TSFR_REQ', { id: transferRequestId, cmdName });
            }
        }
        await commandHandler.execute({ ...event, statement: cmdName, args: [] });
        if (event.data.get('REACTION_TSFR_REQ')?.id === transferRequestId) {
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
