import { BankVisualizer } from '../../../finance/BankVisualizer';
import { bank } from '../../../finance/Bank';
import { MessageEventLocal } from '../../../utils/types';

exports.run = async (event: MessageEventLocal) => {
    await BankVisualizer.showBalance(event.message.channel, event.bankUser, bank.getUserIOUs(event.bankUser.userId));
};
