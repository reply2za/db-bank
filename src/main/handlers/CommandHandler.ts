import { config } from '../utils/constants/constants';
import { isAdmin } from '../utils/utils';
import { CommandHandler } from '@hoursofza/djs-common';
import { EventDataNames } from '../utils/types';
import { processManager } from '../utils/ProcessManager';
import fs from 'fs';

// list of commands that should not be process-specific
const MULTI_PROCESS_CMDS = ['boot', 'update'];
// the output directory name where source files are generated

class CommandHandlerLocal extends CommandHandler<EventDataNames> {
    constructor() {
        super(isAdmin, `./${config.sourceDirPath}/commands`, '../commands');
    }

    getCommand(statement: string, userID: string) {
        if (!processManager.isActive() && !MULTI_PROCESS_CMDS.includes(statement)) return;
        return super.getCommand(statement, userID);
    }

    protected requireModule(): NodeJS.Require {
        return require;
    }

    protected fsModule(): typeof import('fs') {
        return fs;
    }
}

const commandHandler = new CommandHandlerLocal();
export { commandHandler };
