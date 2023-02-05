import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { getUserToTransferTo, roundNumberTwoDecimals } from '../../utils/utils';
import { validateMonetaryAmount } from '../../utils/numberUtils';
import { TransferType } from '../../finance/types';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[1]) {
        event.message.channel.send('charge [user] [amt]');
        return;
    }
    if (!event.args[2]) {
        event.message.channel.send('*error: must add amount*  `i.e. charge [user] [amt]`');
        return;
    }
    const sender = await getUserToTransferTo(event.message, event.args[1], 'charge');
    if (!sender) return;
    const transferAmount = roundNumberTwoDecimals(Number(event.args[2]));
    const isValid = validateMonetaryAmount(transferAmount, sender, event.message.channel);
    if (!isValid) return;
    await bank.transferAmount(sender, event.bankUser, transferAmount, event.message.channel, TransferType.CHARGE);
};
