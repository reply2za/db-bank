import { MessageEventLocal } from '../../../utils/types';
import child_process from 'child_process';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    if (event.args.length < 1) {
        (<TextChannel>event.channel).send('*no arguments provided*');
    } else {
        child_process.exec(event.args.join(' '), { timeout: 10000 }, (error, stdout, stderr) => {
            if (stdout) (<TextChannel>event.channel).send(`\`${stdout}\``);
            if (stderr) (<TextChannel>event.channel).send(`-stderr-\n\`${stderr}\``);
            else if (error) (<TextChannel>event.channel).send(`-error-\n\`${error}\``);
        });
    }
};
