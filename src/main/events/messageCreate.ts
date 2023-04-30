import { config } from '../utils/constants/constants';
import { Message } from 'discord.js';
import { bank } from '../finance/Bank';
import { localStorage } from '../storage/LocalStorage';
import { commandHandler } from '../handlers/CommandHandler';
import { MessageEventLocal } from '../utils/types';
import { formatErrorText, isAdmin } from '../utils/utils';
import Logger from '../utils/Logger';
import { processManager } from '../utils/ProcessManager';

const ONE_MINUTE_MS = 60000;
// timeout for waiting for a response from a user
const WAITING_FOR_RESPONSE_TIME_MS = ONE_MINUTE_MS * 2;
module.exports = async (message: Message) => {
    const msgPrefix = message.content.substring(0, config.prefix.length);
    if (msgPrefix !== config.prefix) return;
    if (config.isDevMode && !isAdmin(message.author.id)) return;
    const args = message.content.replace(/\s+/g, ' ').split(' ');
    // the command name, removes the prefix and any args
    const statement = args[0].substring(1).toLowerCase();
    const command = commandHandler.getCommand(statement, message.author.id);
    if (!command) return;
    let bankUser = bank.getUserCopy(message.author.id);
    if (!bankUser) {
        if (message.author.bot) return;
        if (message.content.toLowerCase() !== `${config.prefix}adduser`) return;
        try {
            bank.addNewUser(message.author, message.author.username, 0);
            await localStorage.saveData(bank.serializeData());
        } catch (e) {
            if (e instanceof Error) Logger.errorLog(e).catch((e) => console.log(e));
            message.channel.send(formatErrorText('could not add author'));
            return;
        }
        if (!bankUser) {
            message.channel.send('*there was an error*');
            return;
        }
    }
    const waitingForResponse = processManager.waitingForUserResponse.get(
        `${bankUser.getUserId()}_${message.channel.id}`
    );
    if (waitingForResponse) {
        if (waitingForResponse.timeInMs < Date.now() + WAITING_FOR_RESPONSE_TIME_MS) return;
        else processManager.waitingForUserResponse.delete(bankUser.getUserId());
    }
    const event: MessageEventLocal = {
        statement,
        message,
        args: args.slice(1),
        prefix: config.prefix,
        bankUser,
        data: new Map(),
    };
    command.run(event).catch((e) => Logger.errorLog(e));
};
