import { Message } from 'discord.js';
import { BankUser } from '../finance/BankUser';
import { ADMIN_IDS } from '../utils/constants';
import { bank } from '../finance/Bank';

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    if (!ADMIN_IDS.includes(`${message.author.id} `)) return;
    let finalString = '';
    bank.getAllUsers().forEach((user) => {
        if (user.balance > 0) {
            finalString += `**${user.name}**: $${user.getBalance()}\n`;
        }
    });
    finalString += '------\n';
    bank.getAllIOUs().forEach((iou) => {
        finalString += `from ${iou.sender.name} to ${iou.receiver.name}\nreason: ${iou.comment}\n\n`;
    });
    message.channel.send(finalString);
};
