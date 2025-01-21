import { bank } from '../../../finance/Bank';
import { EventDataNames, MessageEventLocal } from '../../../utils/types';
import reactions from '../../../utils/constants/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';
import { Message, MessageReaction, SlashCommandBuilder } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import visualizerCommon from '../../../finance/visualizers/visualizerCommon';
import { processManager } from '../../../utils/ProcessManager';
import { djsCommonUtils } from '../../../utils/constants/constants';
import path from 'node:path';

exports.run = async (event: MessageEventLocal) => {
    const balanceMsg = await visualizerCommon.showBalance(
        event.channel,
        event.bankUser,
        bank.getUserIOUs(event.bankUser.getUserId())
    );
    const reactionsList = [reactions.MONEY, reactions.TICKET];
    const userIOUs = bank.getUserIOUs(event.bankUser.getUserId());
    if (userIOUs.length) reactionsList.push(reactions.PAGE_C);
    await djsCommonUtils.attachReactionsToMessage(
        balanceMsg,
        [event.bankUser.getUserId()],
        reactionsList,
        reactionCallback(event),
        undefined,
        undefined,
        45000
    );
};

function reactionCallback(event: MessageEventLocal) {
    return async (reaction: MessageReaction) => {
        reaction.users.remove(event.bankUser.getDiscordUser()).catch();
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
        let transferMsg: Message | undefined = event.data.get(EventDataNames.INITIAL_TRANSFER_MSG);
        if (transferMsg) {
            const activeTransferReq = event.data.get(EventDataNames.REACTION_TSFR_REQ);
            if (activeTransferReq?.cmdName !== cmdName) {
                processManager.removeUserResponseLock(event.bankUser.getUserId(), event.channel.id);
                transferMsg.deletable && (await transferMsg.delete());
                event.data.delete(EventDataNames.INITIAL_TRANSFER_MSG);
                event.data.delete(EventDataNames.REACTION_TSFR_REQ);
            }
        }
        // a unique id for the transfer request
        let transferRequestId;
        // allow the 'view iou' command to be called while a transfer is being initiated
        if (cmdName.includes('transfer')) {
            if (event.data.get(EventDataNames.REACTION_TSFR_REQ)) {
                return;
            } else {
                transferRequestId = uuidv4();
                event.data.set(EventDataNames.REACTION_TSFR_REQ, { id: transferRequestId, cmdName });
            }
        }
        await commandHandler.execute({ ...event, statement: cmdName, args: [] });
        if (event.data.get(EventDataNames.REACTION_TSFR_REQ)?.id === transferRequestId) {
            event.data.delete(EventDataNames.REACTION_TSFR_REQ);
        }
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName(path.basename(__filename).split('.')[0])
        .setDescription('View your bank balance'),
    run: exports.run,
};
