import { isAdmin } from '../utils/utils';
import fs from 'fs';
import { Collection } from 'discord.js';
import { MessageEventLocal } from '../utils/types';

// secondary prefix after the first to tell the app that it is a dev command
const ADMIN_CMD_PREFIX = '$';

class CommandHandler {
    clientCommands = new Collection<string, any>();
    adminCommands = new Collection<string, any>();
    #loadSpecificCommands(innerPath: string, commandsMap: Map<string, any>) {
        const commands = fs.readdirSync(`./dist/${innerPath}`).filter((fileName) => fileName.endsWith('.js'));
        for (const file of commands) {
            const commandName = file.split('.')[0];
            const command = require(`../${innerPath}/${file}`);
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
        if (event.statement[0] === ADMIN_CMD_PREFIX && isAdmin(event.message.author.id)) {
            this.adminCommands.get(event.statement.replace(ADMIN_CMD_PREFIX, ''))?.run(event);
        }
        this.clientCommands.get(event.statement)?.run(event);
    }
}

const commandHandler = new CommandHandler();
export { commandHandler };
