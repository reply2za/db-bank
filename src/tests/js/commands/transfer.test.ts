import { MessageEventLocal } from '../../../main/utils/types';
import { Message, TextBasedChannel } from 'discord.js';
import { commandHandler } from '../../../main/handlers/CommandHandler';
import { bank } from '../../../main/finance/Bank';
import { bankUserLookup } from '../../../main/finance/BankUserLookup';
import { MockMessage } from '../classes/MockMessage';
import { Setup1 } from '../classes/Setup';
import { config } from '../../../main/utils/constants/constants';

const s1 = new Setup1('transfer anna', 'transfer joe');

describe('monetary transfer', () => {
    afterAll(async () => {
        await s1.reset();
    });
    const eventTransferJoe: MessageEventLocal = {
        statement: 'transfer',
        message: <Message>(<unknown>s1.messageFromJoe),
        args: ['anna'],
        prefix: '!',
        bankUser: s1.bankUserJoe,
        data: new Map(),
        channel: <TextBasedChannel>(<unknown>s1.messageFromJoe.channel),
    };

    test('transfer no response ', async () => {
        await commandHandler.execute(eventTransferJoe);
        const channel1Length = s1.channel1.receivedMessages.length;
        expect(channel1Length).toBeGreaterThan(2);
        expect(s1.channel1.receivedMessages[channel1Length - 2]).toBe('*no response provided*');
        expect(s1.channel1.receivedMessages[channel1Length - 1]).toBe('*cancelled transfer*');
    });

    test('joe to send $100 to anna', async () => {
        const amountToSend = 100;
        const amountToSendTxt = `$${amountToSend}`;
        const prevBalanceJoe = bank.findUser('Joe')[0].getBalance();
        const prevBalanceAnna = bank.findUser('Anna')[0].getBalance();
        s1.channel1.receivedMessages.length = 0;
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `${amountToSendTxt}`, s1.userJoe, s1.channel1)],
            [new MockMessage('', 'b', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        await commandHandler.execute(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe('sent $100.00 to Anna');
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna + amountToSend);
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(prevBalanceJoe - amountToSend);
    });

    test('transfer $100 from joe to anna using plus sign', async () => {
        s1.channel1.receivedMessages.length = 0;
        const amountToSend = 100;
        // spacing should not make a difference
        const amountToSendTxt = '25+25+25 + 25';
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `${amountToSendTxt}`, s1.userJoe, s1.channel1)],
            [new MockMessage('', 'b', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        const prevBalanceJoe = bank.findUser('Joe')[0].getBalance();
        const prevBalanceAnna = bank.findUser('Anna')[0].getBalance();
        await commandHandler.execute(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[0]).toContain(config.NO_AMT_SELECTED_TXT);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe('sent $100.00 to Anna');
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna + amountToSend);
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(prevBalanceJoe - amountToSend);
    });

    test('transfer $99 from joe to anna without specifying user', async () => {
        s1.channel1.receivedMessages.length = 0;
        const amountToSend = 99;
        // spacing should not make a difference
        const amountToSendTxt = '25+25+25+24';
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `anna`, s1.userJoe, s1.channel1)],
            [new MockMessage('', `${amountToSendTxt}`, s1.userJoe, s1.channel1)],
            [new MockMessage('', 'b', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        const prevBalanceJoe = bank.findUser('Joe')[0].getBalance();
        const prevBalanceAnna = bank.findUser('Anna')[0].getBalance();
        if (!eventTransferJoe.message) throw new Error('Invalid state');
        eventTransferJoe.message.content = '!transfer';
        eventTransferJoe.args = [];
        await commandHandler.execute(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[0]).toContain("The last user you've transferred to");
        expect(s1.channel1.receivedMessages[0]).toContain('Anna');
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe(
            `sent $${amountToSend.toFixed(2)} to Anna`
        );
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna + amountToSend);
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(prevBalanceJoe - amountToSend);
    });

    test('transfer $50 from anna to joe using multiple signs', async () => {
        s1.channel1.receivedMessages.length = 0;
        const amountToSend = 50.01;
        // spacing should not make a difference
        const amountToSendTxt = '25+25.01+25 - 25';
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `${amountToSendTxt}`, s1.userAnna, s1.channel1)],
            [new MockMessage('', 'b', s1.userAnna, s1.channel1)],
            [new MockMessage('', 'yes', s1.userAnna, s1.channel1)],
        ];
        const prevBalanceJoe = bank.findUser('Joe')[0].getBalance();
        const prevBalanceAnna = bank.findUser('Anna')[0].getBalance();
        await commandHandler.execute(<MessageEventLocal>{
            statement: 'transfer',
            message: <Message>(<unknown>s1.messageFromAnna),
            args: ['Joe'],
            prefix: '!',
            bankUser: s1.bankUserAnna,
            data: new Map(),
            channel: <TextBasedChannel>(<unknown>s1.channel1),
        });
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe('sent $50.01 to Joe');
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna - amountToSend);
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(prevBalanceJoe + amountToSend);
    });

    test('transfer invalid amount x3', async () => {
        s1.channel1.receivedMessages.length = 0;
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', 'anna', s1.userJoe, s1.channel1)],
            [new MockMessage('', '-100', s1.userJoe, s1.channel1)],
            [new MockMessage('', '0', s1.userJoe, s1.channel1)],
            [new MockMessage('', '0.001', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'additional text', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'additional text', s1.userJoe, s1.channel1)],
        ];
        await commandHandler.execute(eventTransferJoe);
        const c1Length = s1.channel1.receivedMessages.length;
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(2);
        // if this fails then the transfer process went beyond the amount validation
        expect(s1.channel1.receivedMessages[c1Length - 2].includes('amount must be greater than')).toBeTruthy();
        expect(s1.channel1.receivedMessages[c1Length - 1]).toBe('*cancelled transfer*');
    });
});

describe('ensure state can be reset', () => {
    // afterAll(() => {
    //     s1.reset();
    // });
    test('view balances', async () => {
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(2324);
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(131);
    });
});
