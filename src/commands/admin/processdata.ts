import { MessageEventLocal } from '../../utils/types';
import { processDataFile } from '../../utils/utils';
import { bank } from '../../finance/Bank';
import { bot } from '../../utils/constants';
import { localStorage } from '../../Storage/LocalStorage';

exports.run = async (event: MessageEventLocal) => {
    const success = await processDataFile(event.message);
    if (success) {
        await new Promise((res) => setTimeout(res, 700));
        const data = await localStorage.retrieveData();
        await bank.deserializeAndLoadData(data, bot.users);
        event.message.channel.send('*contents changed*');
    } else {
        event.message.channel.send('*there was an issue processing the data*');
    }
};
