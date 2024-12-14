import { MessageEventLocal } from '../../utils/types';
import { bot } from '../../utils/constants/constants';
import { Collection, Message, Snowflake, TextChannel } from 'discord.js';
import { bankUserLookup } from '../../finance/BankUserLookup';

// the number of messages to fetch
const NUM_TO_FETCH = 30;
const SENT_MSG_TXT = 'updating...';

exports.run = async (event: MessageEventLocal) => {
    if (!event.args[1]) {
        await (<TextChannel>event.message.channel).send('*expected arguments author-id & num-to-delete*');
        return;
    }
    const msg = await bankUserLookup.getUser(event.args[0])?.getDiscordUser()?.send(SENT_MSG_TXT);
    if (!msg) {
        await (<TextChannel>event.message.channel).send('*could not find author*');
        return;
    }
    const numToDelete = parseInt(event.args[1]);
    if (!numToDelete || numToDelete > NUM_TO_FETCH) {
        await (<TextChannel>event.message.channel).send('*invalid number*');
        return;
    }
    const numRemoved = await removeDBMessage(msg.channel.id, 1, true);
    (<TextChannel>event.message.channel).send(`deleted ${numRemoved} additional messages`);
};

async function removeDBMessage(channelID: string, deleteNum = 1, onlyDB = true): Promise<number> {
    let numMsgsDeleted = 0;
    try {
        const channel = await bot.channels.fetch(channelID);
        if (channel) {
            const msgs: Collection<Snowflake, Message> = await (<TextChannel>channel).messages.fetch({
                limit: NUM_TO_FETCH,
                cache: false,
            });
            if (msgs) {
                for (const [, item] of msgs) {
                    // console.log('-------');
                    // console.log(item.content);
                    // console.log(item.createdAt);
                    // if (item.embeds.pop()?.title?.toLowerCase().includes('charged by zain')) {
                    //     await item.delete();
                    //     numMsgsDeleted++;
                    // }
                    if (item.content.includes(SENT_MSG_TXT) && item.author.id === bot.user?.id && item.deletable) {
                        await item.delete();
                    } else if (item.deletable) {
                        if (!onlyDB || item?.author?.id === bot.user!.id) {
                            await item.delete();
                            deleteNum--;
                            numMsgsDeleted++;
                        }
                        if (!deleteNum) break;
                    }
                }
            } else {
                console.log('no messages found');
            }
        } else {
            console.log('no channel found');
        }
    } catch (e) {
        console.log(e);
    }
    return numMsgsDeleted;
}
