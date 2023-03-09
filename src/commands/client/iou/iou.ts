import { EventDataNames, MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import { attachReactionToMessage } from '../../../utils/utils';
import reactions from '../../../utils/constants/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';
import { MessageReaction } from 'discord.js';
import iouVisualizer from '../../../finance/visualizers/iouVisualizer';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserIOUs(event.bankUser.userId);
    if (ious.length < 1) {
        event.message.channel.send('*no redeemable IOUs found*');
        return;
    }
    const sentIOUs = bank.getUserSentIOUs(event.bankUser.userId);
    const reactionsList = [reactions.KEY];
    if (sentIOUs.length) {
        reactionsList.push(reactions.OUTBOX);
    }
    const redeemableIOUMsg = await iouVisualizer
        .getRedeemableIOUEmbed(ious)
        .setFooter(`redeem IOUs ${sentIOUs.length ? '| view sent IOUs' : ''}`)
        .send(event.message.channel);
    let processingRedeemCmd = false;
    const reactionCallback = async (reaction: MessageReaction) => {
        switch (reaction.emoji.name) {
            case reactions.OUTBOX:
                await commandHandler.execute({ ...event, statement: 'sentiou', args: [] });
                break;
            case reactions.KEY:
                if (processingRedeemCmd) return;
                processingRedeemCmd = true;
                event.data.set(EventDataNames.REDEEM_IOU_EMBED_MSG, redeemableIOUMsg);
                await commandHandler.execute({ ...event, statement: 'redeem', args: [] });
                processingRedeemCmd = false;
                break;
        }
    };
    await attachReactionToMessage(redeemableIOUMsg, [event.message.author], reactionsList, reactionCallback);
};
