import { EventDataNames, MessageEventLocal } from '../../utils/types';
import { exec } from 'child_process';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    const printToChannel = !event.data.get(EventDataNames.IS_SILENT);
    if (printToChannel) await (<TextChannel>event.channel).send('updating time...');
    const process = exec(
        'sudo date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d\' \' -f5-8)Z"',
        async (err, stdout, stderr) => {
            let resp = '';
            if (err) resp += `error: ${stdout}\n`;
            if (stdout) resp += `stdout: ${stdout}\n`;
            if (stderr) resp += `stderr: ${stderr}\n`;
            if (printToChannel) {
                await (<TextChannel>event.channel).send(resp);
                await (<TextChannel>event.channel).send('updated');
            }
            process.disconnect();
        }
    );
};
