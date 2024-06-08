import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { MessageEventLocal } from '../../utils/types';

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
        .send(event.message.channel);
};
