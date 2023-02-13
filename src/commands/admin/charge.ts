import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { getUserResponse, getUserToTransferTo, roundNumberTwoDecimals } from '../../utils/utils';
import { validateMonetaryAmount } from '../../utils/numberUtils';
import { TransferType } from '../../finance/types';
import { BankVisualizer } from '../../finance/BankVisualizer';

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
    if (!sender) {
        event.message.channel.send('*could not find user*');
        return;
    }
    const transferAmount = roundNumberTwoDecimals(Number(event.args[2]));
    const isValid = validateMonetaryAmount(transferAmount, sender, event.message.channel);
    if (!isValid) return;
    event.message.channel.send(`you are charging ${sender.name} $${transferAmount}`);
    await BankVisualizer.getPreTransferConfirmationEmbed().send(event.message.channel);
    const response = await getUserResponse(event.message.channel, event.message.author.id);
    if (!response || response.content.toLowerCase() !== 'yes') {
        event.message.channel.send('*cancelled*');
        return;
    }
    await bank.transferAmount(sender, event.bankUser, transferAmount, event.message.channel, TransferType.CHARGE);
};
