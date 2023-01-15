import { clientCommands, PREFIX } from '../utils/constants';
import { Message } from 'discord.js';
import { bank } from '../finance/Bank';
import { BankUser } from '../finance/BankUser';
import { localStorage } from '../Storage/LocalStorage';

module.exports = async (message: Message) => {
    const msgPrefix = message.content.substring(0, PREFIX.length);
    if (msgPrefix !== PREFIX) return;
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
    const statement = args[0].substring(1).toLowerCase();
    clientCommands.get(statement)?.run(statement, message, args, PREFIX, bankUser);
};
