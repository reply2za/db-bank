import { bank } from '../../finance/Bank';
import { MessageEventLocal } from '../../utils/types';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { bot } from '../../utils/constants/constants';

exports.run = async (event: MessageEventLocal) => {
    let finalString = '';
    bank.getAllUsers().forEach((user) => {
        if (user.getBalance() !== 0) {
            finalString += `**${user.getUsername()}**: $${user.getBalance()}\n`;
        }
    });
    // id to discord username
    let idMap = new Map<string, string>();
    // discord username to id
    let nameMap = new Map<string, string>();
    const getName = async (id: string) => {
        if (idMap.has(id)) {
            return idMap.get(id);
        } else {
            const user = await bot.users.fetch(id);
            if (nameMap.has(user.username)) {
                const replacementName = `${user.username}#${user.discriminator}`;
                if (nameMap.has(replacementName)) {
                    throw new Error(`Unexpected duplicate name ${replacementName}`);
                }
                idMap.set(id, replacementName);
                nameMap.set(replacementName, id);
            }
            return user.username;
        }
    };
    finalString += '\n---IOUs---\n';
    for (let iou of bank.getAllIOUs()) {
        finalString += `**${await getName(iou.sender.id)} to ${await getName(iou.receiver.id)}**${
            iou.quantity > 1 ? ` (x${iou.quantity})` : ''
        } [${iou.expirationDate}]\nreason: ${iou.comment}\n`;
    }
    await new EmbedBuilderLocal().setTitle('Accounts').setDescription(finalString).send(event.channel);
};
