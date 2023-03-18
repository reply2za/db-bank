import { isDevMode, PREFIX } from '../utils/constants/constants';
import { Message } from 'discord.js';
import { bank } from '../finance/Bank';
import { localStorage } from '../storage/LocalStorage';
import { commandHandler } from '../handlers/CommandHandler';
import { MessageEventLocal } from '../utils/types';
import { isAdmin } from '../utils/utils';
import Logger from '../utils/Logger';

module.exports = async (message: Message) => {
    const msgPrefix = message.content.substring(0, PREFIX.length);
    if (msgPrefix !== PREFIX) return;
    if (isDevMode && !isAdmin(message.author.id)) return;
    let bankUser;
    bankUser = bank.getUserCopy(message.author.id);
    if (!bankUser) {
        if (message.author.bot) return;
        if (message.content.toLowerCase() !== `${PREFIX}adduser`) return;
        try {
            bank.addNewUser(message.author, message.author.username, 0);
            await localStorage.saveData(bank.serializeData());
        } catch (e) {
            if (e instanceof Error) Logger.errorLog(e);
            message.channel.send('*error: could not add user*');
            return;
        }
        if (!bankUser) {
            message.channel.send('*there was an error*');
            return;
        }
    }
    const args = message.content.replace(/\s+/g, ' ').split(' ');
    // the command name, removes the prefix and any args
    const statement = args[0].substring(1).toLowerCase();
    const event: MessageEventLocal = {
        statement,
        message,
        args,
        prefix: PREFIX,
        bankUser,
        data: new Map(),
    };
    commandHandler.execute(event).catch((error) => Logger.errorLog(error));
};
