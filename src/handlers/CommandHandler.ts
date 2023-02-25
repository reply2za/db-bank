import { isAdmin } from '../utils/utils';
import fs from 'fs';
import { Collection } from 'discord.js';
import { MessageEventLocal } from '../utils/types';
import { processManager } from '../utils/ProcessManager';

// list of commands that should not be process-specific
const MULTI_PROCESS_CMDS = ['boot'];

class CommandHandler {
    clientCommands = new Collection<string, any>();
    adminCommands = new Collection<string, any>();
    #loadSpecificCommands(innerPath: string, commandsMap: Map<string, any>) {
        const fileNames = fs.readdirSync(`./dist/${innerPath}`).filter((name) => name.endsWith('.js'));
        for (const fileName of fileNames) {
            const commandName = fileName.split('.')[0];
            const command = require(`../${innerPath}/${fileName}`);
            commandsMap.set(commandName, command);
        }
    }
    loadAllCommands() {
        this.#loadSpecificCommands('commands/client', this.clientCommands);
        this.#loadSpecificCommands('commands/admin', this.adminCommands);
        console.log('-loaded commands-');
    }

    /**
     * Executes an event. Admin commands must have a '.' prepending the event's statement name.
     * @param event
     */
    execute(event: MessageEventLocal) {
        if (!processManager.getState() && !MULTI_PROCESS_CMDS.includes(event.statement)) return;
        if (isAdmin(event.message.author.id)) {
            const cmdToRun = this.adminCommands.get(event.statement) || this.clientCommands.get(event.statement);
            cmdToRun?.run(event);
        } else {
            this.clientCommands.get(event.statement)?.run(event);
        }
    }
}

const commandHandler = new CommandHandler();
export { commandHandler };
