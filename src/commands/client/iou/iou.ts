import { MessageEventLocal } from '../../../utils/types';
import { bank } from '../../../finance/Bank';
import { BankVisualizer } from '../../../finance/BankVisualizer';
import { PREFIX } from '../../../utils/constants';
import { attachReactionToMessage } from '../../../utils/utils';
import reactions from '../../../utils/reactions';
import { commandHandler } from '../../../handlers/CommandHandler';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserIOUs(event.bankUser.userId);
    if (ious.length < 1) {
        event.message.channel.send('*no redeemable IOUs found*');
        return;
    }
    const redeemableIOUMsg = await BankVisualizer.getRedeemableIOUEmbed(ious)
        .setFooter(`type '${PREFIX}redeem' to redeem an IOU`)
        .send(event.message.channel);
    const sentIOUs = bank.getUserSentIOUs(event.bankUser.userId);
    const reactionsList = [reactions.KEY];
    if (sentIOUs.length) {
        reactionsList.push(reactions.OUTBOX);
    }

    await attachReactionToMessage(redeemableIOUMsg, [event.message.author], reactionsList, (reaction) => {
        switch (reaction.emoji.name) {
            case reactions.OUTBOX:
                commandHandler.execute({ ...event, statement: 'sentiou', args: [] });
                break;
            case reactions.KEY:
                event.data.set('REDEEM_IOU_EMBED_MSG', redeemableIOUMsg);
                commandHandler.execute({ ...event, statement: 'redeem', args: [] });
                break;
        }
    });
};
