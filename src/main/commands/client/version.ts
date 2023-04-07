const { version } = require('../../../../package.json');
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal().setDescription(version).send(event.message.channel);
};
