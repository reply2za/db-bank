const { version } = require('../../../../package.json');
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal().setDescription(version).send(event.message.channel);
};
