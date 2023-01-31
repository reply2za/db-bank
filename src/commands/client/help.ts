import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal()
        .setTitle('Help')
        .setDescription(
            `commands:
            **balance** - view balance
            **transfer** [name] - initiate transfer process
            **transferiou** - transfer an IOU
            **redeem** - redeem an IOU`
        )
        .send(event.message.channel);
};
