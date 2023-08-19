import { MessageEventLocal } from '../../../main/utils/types';
import { Message } from 'discord.js';
import { Setup1 } from '../classes/Setup';

import { Transfer } from '../../../main/finance/Transfer/Transfer';
import { commandHandler } from '../../../main/handlers/CommandHandler';
import { bankUserLookup } from '../../../main/finance/BankUserLookup';

const s1 = new Setup1('', '');
const historyEvent: MessageEventLocal = {
    statement: 'transfer',
    message: <Message>(<unknown>s1.messageFromJoe),
    args: ['should be set per test'],
    prefix: '!',
    bankUser: s1.bankUserJoe,
    data: new Map(),
};

describe('history', () => {
    test('history standalone method', () => {
        Transfer.printUserHistory(historyEvent.message, [s1.bankUserAnna.getUserId()]);
        expect(s1.channel1.receivedMessages.length).toBeGreaterThan(0);
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toContain(
            "The last user you've transferred to"
        );
        expect(s1.channel1.receivedMessages[s1.channel1.receivedMessages.length - 1]).toContain('Anna');
    });

    test('history within event', async () => {
        await commandHandler.execute(historyEvent);
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
