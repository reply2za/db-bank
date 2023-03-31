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
import { bankUserLookup } from '../src/finance/BankUserLookup';
import { BankUserCopy } from '../src/finance/BankUser/BankUserCopy';
import { localStorage } from '../src/storage/LocalStorage';

const tempBankUserStore: BankUserCopy[] = [];
function init() {
    commandHandler.loadAllCommands();
    const BOT_TEXT_CHANNEL = new TestTextChannel();
    BOT_TEXT_CHANNEL.messages = {
        fetch: async () => {
            return new TestMessage('', '', USER_BOT);
        },
    };
    Object.defineProperty(bot, 'channels', { value: { fetch: () => BOT_TEXT_CHANNEL }, writable: true });
    Object.defineProperty(bot, 'login', { value: {}, writable: true });
    processManager.setActive(true);

    Object.defineProperty(bot, 'users', {
        value: {
            fetch: async (userId: string) => {
                const user = tempBankUserStore.find((user) => user.getUserId() === userId)?.getDiscordUser();
                if (!user) throw new Error('user not found');
                return user;
            },
        },
        writable: true,
    });
}

class Setup1 {
    userJoe: TestDiscordUser;
    userAnna: TestDiscordUser;
    channel1: TestTextChannel;
    messageJoe: TestMessage;
    bankUserJoe: BankUserCopy;
    bankUserAnna: BankUserCopy;
    data: string;

    constructor() {
        this.userJoe = new TestDiscordUser('12341', 'Joe');
        this.userAnna = new TestDiscordUser('313132', 'Anna');
        this.channel1 = new TestTextChannel('123', 'channel1');
        this.messageJoe = new TestMessage('131441241', '!transfer anna', this.userJoe, this.channel1);
        this.bankUserJoe = bank.addNewUser(<User>(<unknown>this.userJoe), 'Joe', 2324);
        this.bankUserAnna = bank.addNewUser(<User>(<unknown>this.userAnna), 'Anna', 131);
        this.data = bank.serializeData();
    }

    async reset() {
        Object.assign(tempBankUserStore, bank.getAllUsers());
        await bank.deserializeAndLoadData(this.data, bot.users);
        await localStorage.saveData(this.data);
    }
}

// global declarations
init();
const s1 = new Setup1();

describe('env setup', () => {
    it('token', () => {
        const myVariable = process.env.CLIENT_TOKEN;
        expect(myVariable).toBe('test_token'); // this value was defined in test-setup.ts
    });
});

describe('monetary transfer', () => {
    afterAll(async () => {
        await s1.reset();
    });
    const eventTransferJoe: MessageEventLocal = {
        statement: 'transfer',
        message: <Message>(<unknown>s1.messageJoe),
        args: ['anna'],
        prefix: '!',
        bankUser: s1.bankUserJoe,
        data: new Map(),
    };
    test('transfer no response ', async () => {
        await commandHandler.execute(eventTransferJoe);
        const c1Length = s1.channel1.receivedMessages.length;
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(2);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 2]).toBe('*no response provided*');
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe('*cancelled transfer*');
    });

    test('transfer sending $100', async () => {
        s1.channel1.receivedMessages.length = 0;
        const amountToSend = 100;
        s1.channel1.awaitMessagesList = [
            [new TestMessage('', `${amountToSend}`, s1.userJoe, s1.channel1)],
            [new TestMessage('', 'b', s1.userJoe, s1.channel1)],
            [new TestMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        const prevBalanceAnna = s1.bankUserAnna.getBalance();
        const prevBalanceJoe = s1.bankUserJoe.getBalance();
        await commandHandler.execute(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe('sent $100.00 to Anna');
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna + amountToSend);
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(prevBalanceJoe - amountToSend);
    });

    test('transfer invalid amount x3', async () => {
        s1.channel1.receivedMessages.length = 0;
        s1.channel1.awaitMessagesList = [
            [new TestMessage('', '-100', s1.userJoe, s1.channel1)],
            [new TestMessage('', '0', s1.userJoe, s1.channel1)],
            [new TestMessage('', '0.001', s1.userJoe, s1.channel1)],
            [new TestMessage('', 'additional text', s1.userJoe, s1.channel1)],
            [new TestMessage('', 'additional text', s1.userJoe, s1.channel1)],
        ];
        await commandHandler.execute(eventTransferJoe);
        const c1Length = s1.channel1.receivedMessages.length;
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(2);
        // if this fails then the transfer process went beyond the amount validation
        expect(s1.channel1.receivedMessages[c1Length - 2].includes('amount must be greater than')).toBeTruthy();
        expect(s1.channel1.receivedMessages[c1Length - 1]).toBe('*cancelled transfer*');
    });
});

describe('ensure state was reset', () => {
    afterAll(() => {
        s1.reset();
    });
    test('view balances', async () => {
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(2324);
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(131);
    });
});
