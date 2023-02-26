import { MessageEventLocal } from '../../utils/types';
import { bank } from '../../finance/Bank';
import { getUserResponse, getUserToTransferTo } from '../../utils/utils';
import { roundNumberTwoDecimals, validateMonetaryAmount } from '../../utils/numberUtils';
import { TransferType } from '../../finance/types';
import { BankVisualizer } from '../../finance/BankVisualizer';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { Colors } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[1]) {
        event.message.channel.send('charge [user] [amt]');
        return;
    }
    const sender = await getUserToTransferTo(event.message, event.args[1], 'charge');
    if (!sender) return;
    if (!event.args[2]) {
        event.message.channel.send('*error: must add amount*  `i.e. charge [user] [amt]`');
        return;
    }
    const transferAmount = roundNumberTwoDecimals(Number(event.args[2]));
    const isValid = validateMonetaryAmount(transferAmount, sender, event.message.channel);
    if (!isValid) return;
    event.message.channel.send(`you are charging ${sender.name} $${transferAmount}`);
    await new EmbedBuilderLocal()
        .setDescription("type a short comment/description ['b' = blank, 'q' = cancel]")
        .setColor(Colors.Orange)
        .send(event.message.channel);
    const commentResponse = (await getUserResponse(event.message.channel, event.message.author.id))?.content;
    let comment = '';
    if (!commentResponse || commentResponse.toLowerCase() === 'q') {
        event.message.channel.send('**cancelled**');
        return;
    }
    if (commentResponse !== 'b') {
        comment = commentResponse;
    }
    await BankVisualizer.getConfirmationEmbed('charge').send(event.message.channel);
    const confirmationResponse = await getUserResponse(event.message.channel, event.message.author.id);
    if (!confirmationResponse || confirmationResponse.content.toLowerCase() !== 'yes') {
        event.message.channel.send('*cancelled*');
        return;
    }
    await bank.transferAmount(
        sender,
        event.bankUser,
        transferAmount,
        event.message.channel,
        TransferType.CHARGE,
        comment
    );
};
