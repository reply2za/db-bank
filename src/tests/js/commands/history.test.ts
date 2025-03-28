import { MessageEventLocal } from '../../../main/utils/types';
import { Message, TextBasedChannel } from 'discord.js';
import { Setup1 } from '../classes/Setup';

import { Transfer } from '../../../main/finance/Transfer/Transfer';
import { commandHandler } from '../../../main/handlers/CommandHandler';
import { bankUserLookup } from '../../../main/finance/BankUserLookup';
import { MockMessage } from '../classes/MockMessage';
import { config } from '../../../main/utils/constants/constants';

const s1 = new Setup1('', '');
const historyEvent: MessageEventLocal = {
    statement: 'transfer',
    message: <Message>(<unknown>s1.messageFromJoe),
    args: [],
    prefix: '!',
    bankUser: s1.bankUserJoe,
    data: new Map(),
    channel: <TextBasedChannel>(<unknown>s1.messageFromJoe.channel),
};

const eventTransferJoe: MessageEventLocal = {
    statement: 'transfer',
    message: <Message>(<unknown>s1.messageFromJoe),
    args: ['anna'],
    prefix: '!',
    bankUser: s1.bankUserJoe,
    data: new Map(),
    channel: <TextBasedChannel>(<unknown>s1.messageFromJoe.channel),
};

describe('history', () => {
    afterAll(async () => {
        await s1.reset();
    });
    test('history standalone method', () => {
        let annaHistory = Transfer.printUserHistory([s1.bankUserAnna.getUserId()]);
        let emptyHistory = Transfer.printUserHistory([]);
        expect(annaHistory).toContain("The last user you've transferred to");
        expect(annaHistory).toContain('Anna');
        expect(emptyHistory).toBe('');
    });

    test('history within event', async () => {
        s1.channel1.awaitMessagesList = [
            [new MockMessage('', `10`, s1.userJoe, s1.channel1)],
            [new MockMessage('', 'b', s1.userJoe, s1.channel1)],
            [new MockMessage('', 'yes', s1.userJoe, s1.channel1)],
        ];
        // initiate a transfer to create history
        s1.channel1.receivedMessages.length = 0;
        await commandHandler.execute(eventTransferJoe);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[0]).toContain(config.NO_AMT_SELECTED_TXT);
        // validate history
        s1.channel1.receivedMessages.length = 0;
        commandHandler.execute(historyEvent);
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[0]).toContain("The last user you've transferred to");
        expect(s1.channel1.receivedMessages[0]).toContain('Anna');
    });
});

describe('ensure state is reset', () => {
    test('view balances', async () => {
        expect(bankUserLookup.getUser(s1.bankUserJoe.getUserId())?.getBalance()).toBe(2324);
        expect(bankUserLookup.getUser(s1.bankUserAnna.getUserId())?.getBalance()).toBe(131);
    });
});
