import { MessageEventLocal } from '../../../utils/types';
import child_process from 'child_process';

exports.run = async (event: MessageEventLocal) => {
    if (event.args.length < 2) {
        event.message.channel.send('*no arguments provided*');
    } else {
        child_process.exec(event.args.slice(1).join(' '), { timeout: 10000 }, (error, stdout, stderr) => {
            if (stdout) event.message.channel.send(`\`${stdout}\``);
            if (stderr) event.message.channel.send(`-stderr-\n\`${stderr}\``);
            else if (error) event.message.channel.send(`-error-\n\`${error}\``);
        });
    }
};
