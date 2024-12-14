import { MessageEventLocal } from '../../../utils/types';
import { calculateTotal } from '../../../finance/utils';
import { formatErrorText, getUserResponse } from '../../../utils/utils';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    let totalTxt = event.args.join(' ');
    if (!totalTxt) {
        await new EmbedBuilderLocal()
            .setDescription('enter the numbers to sum up:\n*ex: `10 + 2.21 - 5`*')
            .send(event.message.channel);
        const response = await getUserResponse(event.message.channel, event.message.author.id);
        if (response && response.content) {
            totalTxt = response.content;
        } else {
            (<TextChannel>event.message.channel).send('*cancelled calc command*');
            return;
        }
    }
    totalTxt = calculateTotal(totalTxt);
    const total = Number(totalTxt);
    if (!Number.isFinite(total)) {
        (<TextChannel>event.message.channel).send(formatErrorText('invalid expression'));
        return;
    }
    (<TextChannel>event.message.channel).send(`total: \`${totalTxt}\``);
    return total;
};
