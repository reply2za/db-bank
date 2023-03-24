import { bank } from '../../finance/Bank';
import { MessageEventLocal } from '../../utils/types';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';

exports.run = async (event: MessageEventLocal) => {
    let finalString = '';
    bank.getAllUsers().forEach((user) => {
        if (user.getBalance() > 0) {
            finalString += `**${user.getUsername()}**: $${user.getBalance()}\n`;
        }
    });
    finalString += '\n---IOUs---\n';
    bank.getAllIOUs().forEach((iou) => {
        finalString += `**from ${iou.sender.name} to ${iou.receiver.name}**${
            iou.quantity > 1 ? ` (x${iou.quantity})` : ''
        }\nreason: ${iou.comment}\n`;
    });
    await new EmbedBuilderLocal().setTitle('Accounts').setDescription(finalString).send(event.message.channel);
};
