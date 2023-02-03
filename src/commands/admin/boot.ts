const hardwareTag = process.env.HARDWARE_TAG?.replace(/\\n/gm, '\n');
import { MessageEventLocal } from '../../utils/types';
import { processManager } from '../../utils/ProcessManager';
import { isDevMode } from '../../utils/constants';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[1]) {
        event.message.channel.send(
            `${processManager.getState() ? 'active' : 'inactive'}: ${process.pid} [${hardwareTag}] (v${
                processManager.version
            }) ${isDevMode ? '(devMode)' : ''}`
        );
    } else if (event.args[2] && matchesHardwareTagOrPID(event.args[2])) {
        if (event.args[1] === 'on') {
            processManager.setState(true);
            event.message.channel.send(`${process.pid} is now on`);
        } else if (event.args[1] === 'off') {
            processManager.setState(false);
            event.message.channel.send(`${process.pid} is now off`);
        }
    }
};

/**
 * Determines if the provided id matches the process's hardware tag or process id. Is case-insensitive.
 * @param id Any string to check.
 */
function matchesHardwareTagOrPID(id: string) {
    return id === process.pid.toString() || id.toLowerCase() === hardwareTag?.toLowerCase();
}
