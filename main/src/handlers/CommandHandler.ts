import { isAdmin } from '../utils/utils';
import fs from 'fs';
import { Collection } from 'discord.js';
import { MessageEventLocal } from '../utils/types';
import { processManager } from '../utils/ProcessManager';
import path from 'path';

// list of commands that should not be process-specific
const MULTI_PROCESS_CMDS = ['boot', 'update'];
// the output directory name where source files are generated
const SOURCE_DIR_NAME = 'dist/src';

class CommandHandler {
    clientCommands = new Collection<string, { run: (event: MessageEventLocal) => Promise<void> }>();
    adminCommands = new Collection<string, { run: (event: MessageEventLocal) => Promise<void> }>();

    /**
     * Parses the provided directory and returns an object containing two lists.
     * One being all the immediate js files in the directory and the other being names of subdirectories.
     * @param dirPath From the project's root, the path to the directory to parse.
     * @private
     */
    #parseRootDirectory(dirPath: string) {
        const subDirs: string[] = [];
        const jsFiles = fs.readdirSync(dirPath).filter((fName) => {
            const extName = path.extname(fName);
            if (extName) {
                return extName === '.js';
            } else {
                subDirs.push(fName);
            }
            return false;
        });
        return {
            // the root js files in the directory
            jsFiles,
            // list of subdirectories
            subDirs,
        };
    }

    #loadSpecificCommands(innerPath: string, commandsMap: Map<string, any>) {
        const dirPath = `./${SOURCE_DIR_NAME}/${innerPath}`;
        // maps a filename to the correct relative path
        const cmdFileReference = new Map();
        let rootFiles = this.#parseRootDirectory(dirPath);
        rootFiles.jsFiles.forEach((fileName) => cmdFileReference.set(fileName, `../${innerPath}/${fileName}`));
        for (const subDirName of rootFiles.subDirs) {
            const subDirPath = `${dirPath}/${subDirName}`;
            const subRootFiles = this.#parseRootDirectory(subDirPath);
            if (subRootFiles.subDirs.length > 0) throw new Error('unsupported file structure');
            subRootFiles.jsFiles.forEach((fileName) =>
                cmdFileReference.set(fileName, `../${innerPath}/${subDirName}/${subDirName}.js`)
            );
        }
        cmdFileReference.forEach((relativePath, fileName) => {
            const commandName = fileName.split('.')[0];
            const command = require(relativePath);
            commandsMap.set(commandName, command);
        });
    }

    loadAllCommands() {
        this.#loadSpecificCommands('commands/client', this.clientCommands);
        this.#loadSpecificCommands('commands/admin', this.adminCommands);
        console.log('-loaded commands-');
    }

    /**
     * Executes an event.
     * @param event
     */
    async execute(event: MessageEventLocal) {
        await this.getCommand(event.statement, event.message.author.id)?.run(event);
    }

    /**
     * Returns the command method for the given command name.
     * @param statement The command name.
     * @param authorId The id of the author who sent the command.
     */
    getCommand(statement: string, authorId: string): { run: (event: MessageEventLocal) => Promise<void> } | undefined {
        if (!processManager.isActive() && !MULTI_PROCESS_CMDS.includes(statement)) return;
        if (isAdmin(authorId)) {
            return this.adminCommands.get(statement) || this.clientCommands.get(statement);
        } else {
            return this.clientCommands.get(statement);
        }
    }
}

const commandHandler = new CommandHandler();
export { commandHandler };
