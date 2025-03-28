import { MessageEventLocal } from '../../../main/utils/types';
import { FetchChannelOptions, Message, TextBasedChannel, TextChannel } from 'discord.js';
import { commandHandler } from '../../../main/handlers/CommandHandler';
import { BidSetup1, Setup1 } from '../classes/Setup';
import { bidManager } from '../../../main/finance/bid/BidManager';
import { bot, config } from '../../../main/utils/constants/constants';

const s1 = new Setup1('transfer anna', 'transfer joe');
const bidS1 = new BidSetup1('bid', 'bid');

describe('bid events', () => {
    let spy: any;
    afterAll(async () => {
        await s1.reset();
        await bidS1.reset();
    });

    beforeAll(() => {
        const aId = bot.channels.fetch('1065729072287715329');
        spy = jest
            .spyOn(bot.channels, 'fetch')
            .mockImplementation((id: string, options?: FetchChannelOptions | undefined) => {
                return new Promise(async (res, rej) => {
                    if (id === config.TV_BID_CH) {
                        res(<TextChannel>(<unknown>bidS1.channel1));
                    } else {
                        if (id == '1065729072287715329') res(await aId);
                        else console.log('need: ' + id);
                    }
                });
            });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('bid in an invalid channel ', async () => {
        const invalidChannelBidJoe: MessageEventLocal = {
            statement: 'bid',
            message: <Message>(<unknown>s1.messageFromJoe),
            args: ['.5'],
            prefix: '!',
            bankUser: s1.bankUserJoe,
            data: new Map(),
            channel: <TextBasedChannel>(<unknown>s1.messageFromJoe.channel),
        };
        await commandHandler.execute(invalidChannelBidJoe);
        const channel1Length = s1.channel1.receivedMessages.length;
        expect(channel1Length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages.pop()).toBe('You can only bid in a designated bidding channel');
    });

    test('bid in valid channel, invalid amount ', async () => {
        const validChannelBidJoe: MessageEventLocal = {
            statement: 'bid',
            message: <Message>(<unknown>bidS1.messageFromUserA),
            args: ['xyz'],
            prefix: '!',
            bankUser: bidS1.bankUserA,
            data: new Map(),
            channel: <TextBasedChannel>(<unknown>bidS1.messageFromUserA.channel),
        };
        await commandHandler.execute(validChannelBidJoe);
        const channel1Length = bidS1.channel1.receivedMessages.length;
        expect(channel1Length).toBeGreaterThan(0);
        expect(bidS1.channel1.receivedMessages.pop()).toBe('Bid must be a number');
    });
    test('bid in valid channel, valid amount ', async () => {
        const validChannelBidJoe: MessageEventLocal = {
            statement: 'bid',
            message: <Message>(<unknown>bidS1.messageFromUserA),
            args: ['.50'],
            prefix: '!',
            bankUser: bidS1.bankUserA,
            data: new Map(),
            channel: <TextBasedChannel>(<unknown>bidS1.messageFromUserA.channel),
        };
        await commandHandler.execute(validChannelBidJoe);
        const channel1Length = bidS1.channel1.receivedMessages.length;
        expect(channel1Length).toBe(2);
        let bidEvent = bidManager.getBidEvent(bidS1.channel1.id);
        expect(bidS1.channel1.receivedMessages.pop()).toBe('Bid of $0.5 has been placed by Josephine');
        const bidEmbed = bidS1.channel1.receivedMessages.pop();
        expect(bidEmbed).toContain('starting bid: $');
        expect(bidEmbed).toContain('minimum increment: $');
        expect(!!bidEvent).toBe(true);
        if (!bidEvent) return;
        expect(spy).toHaveBeenCalled();
    });
});
