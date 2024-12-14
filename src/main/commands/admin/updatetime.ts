import { MessageEventLocal } from '../../utils/types';
import { exec } from 'child_process';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    await (<TextChannel>event.message.channel).send('updating time...');
    exec(
        'sudo date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d\' \' -f5-8)Z"',
        async (err, stdout, stderr) => {
            let resp = '';
            if (err) resp += `error: ${stdout}\n`;
            if (stdout) resp += `stdout: ${stdout}\n`;
            if (stderr) resp += `stderr: ${stderr}\n`;
            await (<TextChannel>event.message.channel).send(resp);
            await (<TextChannel>event.message.channel).send('updated');
            process.disconnect();
        }
    );
};
