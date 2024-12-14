import Logger from '../../utils/Logger';
import { MessageEventLocal } from '../../utils/types';
import { processManager } from '../../utils/ProcessManager';
import { config, djsCommonUtils } from '../../utils/constants/constants';
import reactions from '../../utils/constants/reactions';
import { MessageReaction, TextChannel, User } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[0]) {
        displayStatus(event).catch((err) => Logger.debugLog(err));
    } else if (event.args[1] && matchesHardwareTagOrPID(event.args[1])) {
        if (event.args[0] === 'on') {
            setStateActive();
        } else if (event.args[0] === 'off') {
            setStateInactive();
        }
    }
};

function getBootStatus() {
    return `${processManager.isActive() ? '**active**' : 'inactive'}: ${process.pid} [*${config.hardwareTag}*] (v${
        processManager.version
    }) ${config.isDevMode ? '(devMode)' : ''}`;
}

async function displayStatus(event: MessageEventLocal) {
    const sentMsg = await (<TextChannel>event.message.channel).send(getBootStatus());
    await djsCommonUtils.attachReactionsToMessage(
        sentMsg,
        [event.bankUser.getUserId()],
        [reactions.GEAR],
        (reaction: MessageReaction, reactionUser: User) => {
            if (processManager.isActive()) {
                setStateInactive();
            } else {
                setStateActive();
            }
            reaction.users.remove(reactionUser.id);
            sentMsg.edit({ content: getBootStatus() });
        }
    );
}

function setStateActive() {
    processManager.setActive(true);
}

function setStateInactive() {
    processManager.setActive(false);
}

/**
 * Determines if the provided id matches the process's hardware tag or process id. Is case-insensitive.
 * @param id Any string to check.
 */
function matchesHardwareTagOrPID(id: string) {
    return id === process.pid.toString() || id.toLowerCase() === config.hardwareTag.toLowerCase();
}
