import { MessageEventLocal } from '../../utils/types';
import { execSync } from 'child_process';
import { processManager } from '../../utils/ProcessManager';
import { config } from '../../utils/constants/constants';
import { TextChannel } from 'discord.js';
import { bidManager } from '../../finance/bid/BidManager';

exports.run = async (event: MessageEventLocal): Promise<void> => {
    const bidEvents = bidManager.getAllActiveBidEvents();
    if (processManager.isActive()) {
        if (event.args[0] !== 'force') {
            let bidsAreInProgress = false;
            for (const bidEvent of bidEvents) {
                if (!bidEvent.hasEnded() && bidEvent.getHighestBidder()) {
                    await bidEvent.getBidEmbed().send(event.channel);
                    bidsAreInProgress = true;
                }
            }
            if (bidsAreInProgress) {
                await (<TextChannel>event.channel).send(
                    `Bids are in progress. Use \`${event.prefix}update force\` to force an update`
                );
                return;
            }
        } else {
            event.args.shift();
        }
    }

    const processId = event.args[0];
    if (processId) {
        if (processId === process.pid.toString() || processId === 'all') {
            await update(<TextChannel>event.channel);
        }
    } else if (processManager.isActive() && !config.isDevMode) {
        await update(<TextChannel>event.channel);
    }
};

async function update(channel: TextChannel) {
    await channel.send('updating... (notice: prod process may start in a sidelined state)');
    execSync('git stash && git pull && npm run prod');
}
