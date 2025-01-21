import { MessageEventLocal } from '../../../main/utils/types';
import { Channel, Message, TextBasedChannel } from 'discord.js';
import { Setup1 } from '../classes/Setup';
import { commandHandler } from '../../../main/handlers/CommandHandler';

const s1 = new Setup1('calculate 100-20', '');
const calculateEvent: MessageEventLocal = {
    statement: 'calculate',
    message: <Message>(<unknown>s1.messageFromJoe),
    args: ['should be set per test'],
    prefix: '!',
    bankUser: s1.bankUserJoe,
    data: new Map(),
    channel: <TextBasedChannel>(<unknown>s1.messageFromJoe.channel),
};

const formatTotalResult = (total: number) => {
    return `total: \`${total}\``;
};

describe('calculate', () => {
    test('calculate total with no spaces', () => {
        calculateEvent.args = ['100-20'];
        commandHandler.execute(calculateEvent);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe(formatTotalResult(80));
    });

    test('calculate total with spaces', () => {
        calculateEvent.args = ['100 - 20 + 30'];
        commandHandler.execute(calculateEvent);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe(formatTotalResult(110));
    });

    test('calculate total with space and no space', () => {
        calculateEvent.args = ['100 - 20+31'];
        commandHandler.execute(calculateEvent);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe(formatTotalResult(111));
    });
});
