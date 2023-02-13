import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal()
        .setTitle('Help List')
        .setDescription(
            `**bank** - view balance
            **transfer** [name] - initiate transfer process
            **transferiou** - transfer an IOU
            **ious** - view your IOUs
            **redeem** - redeem an IOU`
        )
        .send(event.message.channel);
};
