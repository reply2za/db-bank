import { MessageEventLocal } from '../../utils/types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { config } from '../../utils/constants/constants';

exports.run = async (event: MessageEventLocal) => {
    await new EmbedBuilderLocal()
        .setTitle('Dev Help List')
        .setDescription(
            `*note: production processes start up in an inactive state*
**bank commands**
\`view\` - view all bank accounts
\`charge [user]\` - charge an account
\`credit [user]\` - credit an account
**process commands**
\`boot\` - see all processes
\`update\` - update the process
\`processdata [file.txt]\` - update a process's ${config.dataFile}
\`shutdown\` - kill the process & remove it from pm2`
        )
        .send(event.message.channel);
};
