import { bot, config } from '../utils/constants/constants';
import { ChatInputCommandInteraction, Interaction } from 'discord.js';
import { MessageEventLocal } from '../utils/types';
import Logger from '../utils/Logger';
import { commandHandler } from '../handlers/CommandHandler';
import { bank } from '../finance/Bank';
import logger from '../utils/Logger';
import { processManager } from '../utils/ProcessManager';

module.exports = async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
        console.log('not chat input command');
    }
    interaction = <ChatInputCommandInteraction>interaction;
    let bankUser = bank.getUserCopy(interaction.user.id);
    if (!bankUser) {
        await interaction.reply(`Bank user not found. Please run ${config.prefix}bank first.`);
        return;
    }
    if (processManager.isAwaitingUserResponse(interaction.user.id, interaction.channelId)) {
        interaction.reply('*Cannot send as another command is in progress...*');
        return;
    }
    const event: MessageEventLocal = {
        statement: interaction.commandName,
        args: [],
        interaction,
        prefix: config.prefix,
        bankUser,
        data: new Map(),
        channel: interaction.channel!,
    };
    const commandResponse = commandHandler.getCommand(event.statement, interaction.user.id);
    if (commandResponse.command) {
        interaction.reply(`/${interaction.commandName}`);
        commandResponse.command.run(event).catch((e) => Logger.errorLog(e));
    } else {
        await logger.errorLog(`An invalid slash command has been used: ${interaction.commandName}`);
    }
};
