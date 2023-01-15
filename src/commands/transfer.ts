import { getUserResponse } from '../utils/utils';
import { bank } from '../finance/Bank';
import { ADMIN_IDS } from '../utils/constants';
import { TransferManager } from '../finance/TransferManager';
import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    let recipientID;
    if (!args[1]) {
        message.channel.send('Who you would like to send money to?');
        const newMsg = await getUserResponse(message.channel, message.author.id);
        recipientID = newMsg?.mentions.users.first()?.id;
        if (!recipientID) {
            newMsg?.content && args.splice(1, 0);
            if (!args[1]) {
                message.channel.send('must specify user to send to');
                return;
            }
        }
    } else {
        recipientID = message.mentions.users.first()?.id;
    }
    let recipientBankUser;
    if (recipientID) {
        recipientBankUser = bank.getUser(recipientID);
    } else {
        const transferUser = args.slice(1).join(' ');
        const matchingUsers = bank.findUser(transferUser);
        recipientBankUser = matchingUsers[0];
    }
    if (!recipientBankUser) {
        return message.channel.send('could not find user');
    }
    if (recipientBankUser.userId === message.author.id && !ADMIN_IDS.includes(`${message.author.id} `)) {
        return message.channel.send('you cannot send money to yourself');
    }
    await new TransferManager(bankUser).processMonetaryTransfer(message.channel, recipientBankUser);
};
