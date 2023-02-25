import { isDevMode, PREFIX } from '../utils/constants';
import { Message } from 'discord.js';
import { bank } from '../finance/Bank';
import { BankUser } from '../finance/BankUser';
import { localStorage } from '../storage/LocalStorage';
import { commandHandler } from '../handlers/CommandHandler';
import { MessageEventLocal } from '../utils/types';
import { isAdmin } from '../utils/utils';

module.exports = async (message: Message) => {
    const msgPrefix = message.content.substring(0, PREFIX.length);
    if (msgPrefix !== PREFIX) return;
    if (isDevMode && !isAdmin(message.author.id)) return;
    let bankUser;
    bankUser = bank.getUser(message.author.id);
    if (!bankUser) {
        try {
            bank.addNewUser(new BankUser(message.author, message.author.username, 0));
            await localStorage.saveData(bank.serializeData());
        } catch (e) {
            console.log(e);
            message.channel.send('could not add user, please contact administrator');
        }
    }
    if (!bankUser) return;
    const args = message.content.replace(/\s+/g, ' ').split(' ');
    // the command name, removes the prefix and any args
    const statement = args[0].substring(1).toLowerCase();
    const event: MessageEventLocal = {
        statement,
        message,
        args,
        prefix: PREFIX,
        bankUser,
    };
    commandHandler.execute(event);
};
