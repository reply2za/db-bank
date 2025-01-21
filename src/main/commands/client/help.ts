import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { MessageEventLocal } from '../../utils/types';
import { SlashCommandBuilder } from 'discord.js';
import path from 'node:path';
import { bot, config } from '../../utils/constants/constants';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal()
        .setTitle('Help List')
        .setDescription(
            `
**bank** - view balance
**transfer** [name] - initiate transfer process
**calculate** [expression] - calculate an expression
**bid [amount]** - bid in a bidding channel
**maxbid [amount]** - sets a max bid for the VIP TV access

-- IOU commands -- 
**transferIOU** - transfer an IOU
**ious** - view your received IOUs
**sentIOU** - view your sent IOUs
**redeem** - redeem an IOU`
        )
        .setFooter('commands are not case sensitive')
        .send(event.channel);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName(path.basename(__filename).split('.')[0])
        .setDescription(`Displays the help list`),
    run: exports.run,
};
