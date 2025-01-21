import { config } from '../utils/constants/constants';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';

export default async function run() {
    const commands: any[] = [];
    // Grab all the command folders from the commands directory you created earlier
    const foldersPath = path.join(__dirname, '..', 'commands', 'client');
    const commandFolder = fs.readdirSync(foldersPath);

    for (const item of commandFolder) {
        // Grab all the command files from the commands directory you created earlier
        const commandsPath = path.join(foldersPath, item);
        const stat = fs.statSync(commandsPath);
        let commandFiles: string[] | null = null;
        if (stat.isDirectory()) {
            commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
        } else if (item.endsWith('.js')) {
            commandFiles = [];
        }
        if (commandFiles) {
            // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'run' in command) {
                    commands.push(command.data.toJSON());
                }
            }
        }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(config.token);

    try {
        console.log(`Reloading ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data: any = await rest.put(Routes.applicationGuildCommands(config.BOT_ID, '827425831365640242'), {
            body: commands,
        });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('error', error);
    }
}
