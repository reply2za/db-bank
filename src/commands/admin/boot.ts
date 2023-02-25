import Logger from '../../utils/Logger';
import { MessageEventLocal } from '../../utils/types';
import { processManager } from '../../utils/ProcessManager';
import { isDevMode } from '../../utils/constants';
import reactions from '../../utils/reactions';
import { MessageReaction, User } from 'discord.js';
import { attachReactionToMessage } from '../../utils/utils';

const hardwareTag = process.env.HARDWARE_TAG?.replace(/\\n/gm, '\n');

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[1]) {
        displayStatus(event).catch((err) => Logger.debugLog(err));
    } else if (event.args[2] && matchesHardwareTagOrPID(event.args[2])) {
        if (event.args[1] === 'on') {
            setStateActive();
        } else if (event.args[1] === 'off') {
            setStateInactive();
        }
    }
};

function getBootStatus() {
    return `${processManager.getState() ? '**active**' : 'inactive'}: ${process.pid} [*${hardwareTag}*] (v${
        processManager.version
    }) ${isDevMode ? '(devMode)' : ''}`;
}

async function displayStatus(event: MessageEventLocal) {
    const sentMsg = await event.message.channel.send(getBootStatus());
    await attachReactionToMessage(
        sentMsg,
        [event.message.author],
        [reactions.GEAR],
        (reaction: MessageReaction, reactionUser: User) => {
            if (processManager.getState()) {
                setStateInactive();
            } else {
                setStateActive();
            }
            reaction.users.remove(reactionUser.id);
            sentMsg.edit({ content: getBootStatus() });
        },
        () => {
            sentMsg.reactions.removeAll();
        }
    );
}

function setStateActive() {
    processManager.setState(true);
}

function setStateInactive() {
    processManager.setState(false);
}

/**
 * Determines if the provided id matches the process's hardware tag or process id. Is case-insensitive.
 * @param id Any string to check.
 */
function matchesHardwareTagOrPID(id: string) {
    return id === process.pid.toString() || id.toLowerCase() === hardwareTag?.toLowerCase();
}
