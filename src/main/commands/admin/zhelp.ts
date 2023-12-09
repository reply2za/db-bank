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
\`createbid [date] [time] [description]\` - create a bid
\`cancelbid\` - cancel a bid
**process commands**
\`boot\` - see all processes
\`update\` - update the process
\`restart\` - restart the process
\`shutdown\` - kill the process & remove it from pm2
**data commands**
\`processdata [file.txt]\` - update a process's ${config.dataFile}
\`processdata previous\` - view the previous ${config.dataFile} contents
`
        )
        .send(event.message.channel);
};
