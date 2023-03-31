import { USER_BOT } from './constants';
import { commandHandler } from '../src/handlers/CommandHandler';
import { Message, User } from 'discord.js';
import { MessageEventLocal } from '../src/utils/types';
import { bot } from '../src/utils/constants/constants';
import { TestDiscordUser } from './classes/TestDiscordUser';
import { TestMessage } from './classes/TestMessage';
import { TestTextChannel } from './classes/TestTextChannel';
import { processManager } from '../src/utils/ProcessManager';
import { bank } from '../src/finance/Bank';

function beforeAll() {
    commandHandler.loadAllCommands();
    // @ts-ignore
    global.DATA_FILE = './src/test/TestData.txt';
    const BOT_TEXT_CHANNEL = new TestTextChannel();
    BOT_TEXT_CHANNEL.messages = {
        fetch: async () => {
            return new TestMessage('', '', USER_BOT);
        },
    };

    Object.defineProperty(bot, 'channels', { value: { fetch: () => BOT_TEXT_CHANNEL }, writable: true });
    Object.defineProperty(bot, 'login', { value: {}, writable: true });
    processManager.setActive(true);
}

beforeAll();

const userJoe = new TestDiscordUser('12341', 'Joe');
const userAnna = new TestDiscordUser('313132', 'Anna');
const channel1 = new TestTextChannel('123', 'channel1');

const messageJoe = new TestMessage('131441241', '!transfer anna', userJoe, channel1);
const bankUserJoe = bank.addNewUser(<User>(<unknown>userJoe), 'Joe', 2324);
const bankUserAnna = bank.addNewUser(<User>(<unknown>userAnna), 'Anna', 131);

describe('test env', () => {
    it('should use environment variables', () => {
        const myVariable = process.env.CLIENT_TOKEN;
        expect(myVariable).toBe('test_token'); // this value was defined in test-setup.ts
    });
});

describe('test transfer', () => {
    const eventTransferJoe: MessageEventLocal = {
        statement: 'transfer',
        message: <Message>(<unknown>messageJoe),
        args: ['anna'],
        prefix: '!',
        bankUser: bankUserJoe,
        data: new Map(),
    };
    test('test no response ', async () => {
        await commandHandler.execute(eventTransferJoe);
        expect(channel1.receivedMessages.length).toBeGreaterThan(2);
        expect(channel1.receivedMessages[channel1.receivedMessages.length - 2]).toBe('*no response provided*');
        expect(channel1.receivedMessages[channel1.receivedMessages.length - 1]).toBe('*cancelled transfer*');
    });

    test('test given amount', async () => {
        channel1.receivedMessages.length = 0;
        channel1.awaitMessagesList = [
            [new TestMessage('', '100', userJoe, channel1)],
            [new TestMessage('', 'b', userJoe, channel1)],
            [new TestMessage('', 'yes', userJoe, channel1)],
        ];
        await commandHandler.execute(eventTransferJoe);
        expect(channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(channel1.receivedMessages[channel1.receivedMessages.length - 1]).toBe('sent $100.00 to Anna');
    });

    test('test invalid amount', async () => {
        channel1.receivedMessages.length = 0;
        channel1.awaitMessagesList = [
            [new TestMessage('', '-100', userJoe, channel1)],
            [new TestMessage('', '0', userJoe, channel1)],
            [new TestMessage('', '0', userJoe, channel1)],
        ];
        await commandHandler.execute(eventTransferJoe);
        expect(channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(channel1.receivedMessages[channel1.receivedMessages.length - 1]).toBe('*cancelled transfer*');
    });
});

jest.resetAllMocks();
