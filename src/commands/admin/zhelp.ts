import { MessageEventLocal } from '../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    event.message.channel.send(`-dev help list-
note: production processes start up in an inactive state
    **bank commands**
    \`view\` - view all bank accounts
    \`charge [user] [amt]\` - charge an account
    **process commands**
    \`boot\` - see all processes
    \`update\` - update the process
    \`processdata [file.txt]\` - update a process's localData.txt
    \`shutdown\` - kill the process & remove it from pm2
    `);
};
