import { MessageEventLocal } from '../../utils/types';
import { execSync } from 'child_process';
import { processManager } from '../../utils/ProcessManager';
import { config } from '../../utils/constants/constants';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    const processId = event.args[0];
    if (processId) {
        if (processId === process.pid.toString() || processId === 'all') {
            await update(<TextChannel>event.message.channel);
        }
    } else if (processManager.isActive() && !config.isDevMode) {
        await update(<TextChannel>event.message.channel);
    }
};

async function update(channel: TextChannel) {
    await channel.send('updating... (notice: prod process starts in a sidelined state)');
    execSync('git stash && git pull && npm run prod');
}
