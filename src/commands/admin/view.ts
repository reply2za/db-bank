import { bank } from '../../finance/Bank';
import { MessageEventLocal } from '../../utils/types';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';

exports.run = async (event: MessageEventLocal) => {
    let finalString = '';
    bank.getAllUsers().forEach((user) => {
        if (user.balance > 0) {
            finalString += `**${user.name}**: $${user.getBalance()}\n`;
        }
    });
    finalString += '\n---IOUs---\n';
    bank.getAllIOUs().forEach((iou) => {
        finalString += `**from ${iou.sender.name} to ${iou.receiver.name}**\nreason: ${iou.comment}\n`;
    });
    await new EmbedBuilderLocal().setTitle('Accounts').setDescription(finalString).send(event.message.channel);
};
