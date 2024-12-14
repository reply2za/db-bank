import { bank } from '../../finance/Bank';
import { commandHandler } from '../../handlers/CommandHandler';
import { EventDataNames, MessageEventLocal } from '../../utils/types';
import { getCurrentMoment } from '../../utils/utils';
import { TextChannel } from 'discord.js';

exports.run = async (event: MessageEventLocal) => {
    if (event.args.length < 1) {
        const bidAmt = event.bankUser.getMaxBid(getCurrentMoment());
        if (bidAmt <= 0) {
            (<TextChannel>event.message.channel).send('you do not have a max bid set');
        } else {
            (<TextChannel>event.message.channel).send("you set today's max bid to: $" + bidAmt);
        }
    } else {
        const bidAmt = Number(event.args[0]);
        if (bidAmt && !isNaN(bidAmt) && bidAmt > 0.25) {
            const bankUser = bank.setMaxBidAmount(event.bankUser.getUserId(), bidAmt);
            if (!bankUser) {
                (<TextChannel>event.message.channel).send('there was an error setting the max bid');
                return;
            }
            (<TextChannel>event.message.channel).send("today's max bid of $" + bidAmt + ' has been set!');
            const data = new Map();
            data.set(EventDataNames.IS_MAX_BID, 'true');
            const messageEvent: MessageEventLocal = {
                statement: 'bid',
                message: event.message,
                args: ['.01'],
                prefix: event.prefix,
                bankUser,
                data: data,
            };
            commandHandler.getCommand('bid', event.bankUser.getUserId()).command?.run(messageEvent);
        } else {
            (<TextChannel>event.message.channel).send('bid amount must be a positive number greater than .25');
        }
    }
};
