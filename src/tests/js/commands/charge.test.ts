import { MessageEventLocal } from '../../../main/utils/types';
import { Message } from 'discord.js';
import { bank } from '../../../main/finance/Bank';
import { bankUserLookup } from '../../../main/finance/BankUserLookup';
import { MockMessage } from '../classes/MockMessage';
import { Setup1 } from '../classes/Setup';
import { roundNumberTwoDecimals } from '../../../main/utils/numberUtils';
const charge = require('../../../main/commands/admin/charge');

const s1 = new Setup1('charge anna', 'charge joe');

describe('monetary charge', () => {
    afterAll(async () => {
        await s1.reset();
    });
    const eventTransferJoe: MessageEventLocal = {
        statement: 'charge',
        message: <Message>(<unknown>s1.messageFromJoe),
        args: ['anna'],
        prefix: '!',
        bankUser: s1.bankUserJoe,
        data: new Map(),
    };

    test('charge no response ', async () => {
        await charge.run(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(2);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 2]).toBe('*no response provided*');
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toBe('*cancelled charge*');
    });

    test('joe charge $100 to anna', async () => {
        s1.channel1.receivedMessages.length = 0;
        const amountToSend = 100;
        const amountToSendTxt = `$${amountToSend}`;
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `${amountToSendTxt}`, s1.userJoe, s1.channel1)],
            [new MockMessage('', 'b', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        const prevBalanceAnna = bank.findUser('Anna')[0].getBalance();
        await charge.run(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toContain('charged Anna $100.00');
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna - amountToSend);
    });

    test('charge anna more than her balance', async () => {
        s1.channel1.receivedMessages.length = 0;
        // spacing should not make a difference
        const amountToSendTxt = '25+25+25 + 25';
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `${amountToSendTxt}`, s1.userJoe, s1.channel1)],
            [new MockMessage('', 'b', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        const prevBalanceAnna = bank.findUser('Anna')[0].getBalance();
        await charge.run(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        console.log(s1.channel1.receivedMessages.length);
        expect(s1.channel1.receivedMessages[2]).toContain("cannot charge more than the sender's balance");
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toContain('cancelled charge');
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(prevBalanceAnna);
    });

    test('charge joe $50 using multiple signs', async () => {
        s1.channel1.receivedMessages.length = 0;
        const amountToCharge = 50.01;
        // spacing should not make a difference
        const amountToSendTxt = '25+25.01+25 - 25';
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `${amountToSendTxt}`, s1.userAnna, s1.channel1)],
            [new MockMessage('', 'b', s1.userAnna, s1.channel1)],
            [new MockMessage('', 'yes', s1.userAnna, s1.channel1)],
        ];
        const prevBalanceJoe = bank.findUser('Joe')[0].getBalance();
        await charge.run(<MessageEventLocal>{
            statement: 'transfer',
            message: <Message>(<unknown>s1.messageFromAnna),
            args: ['Joe'],
            prefix: '!',
            bankUser: s1.bankUserAnna,
            data: new Map(),
        });
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toContain('charged Joe $50.01');
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(
            roundNumberTwoDecimals(prevBalanceJoe - amountToCharge)
        );
    });

    test('transfer invalid amount x3', async () => {
        s1.channel1.receivedMessages.length = 0;
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', '-100', s1.userJoe, s1.channel1)],
            [new MockMessage('', '0', s1.userJoe, s1.channel1)],
            [new MockMessage('', '0.001', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'additional text', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'additional text', s1.userJoe, s1.channel1)],
        ];
        await charge.run(eventTransferJoe);
        const c1Length = s1.channel1.receivedMessages.length;
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(2);
        // if this fails then the transfer process went beyond the amount validation
        expect(s1.channel1.receivedMessages[c1Length - 2].includes('amount must be greater than')).toBeTruthy();
        expect(s1.channel1.receivedMessages[c1Length - 1]).toContain('cancelled charge');
    });
});

describe('ensure state can be reset', () => {
    afterAll(() => {
        s1.reset();
    });
    test('view balances', async () => {
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(2324);
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(131);
    });
});
