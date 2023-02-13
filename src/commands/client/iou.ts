import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { BankVisualizer } from '../../finance/BankVisualizer';
import { PREFIX } from '../../utils/constants';

exports.run = async (event: MessageEventLocal) => {
    const ious = bank.getUserIOUs(event.bankUser.userId);
    if (ious.length < 1) {
        event.message.channel.send('*no redeemable IOUs found*');
        return;
    }
    await BankVisualizer.getRedeemableIOUEmbed(ious)
        .setFooter(`type '${PREFIX}redeem' to redeem an IOU`)
        .send(event.message.channel);
};
