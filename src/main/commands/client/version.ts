import { version } from '../../../../package.json';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal()
        .setDescription(`[${version}](https://github.com/reply2za/db-bank)`)
        .send(event.channel);
};
