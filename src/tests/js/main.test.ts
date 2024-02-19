import { commandHandler } from '../../main/handlers/CommandHandler';
import { bot, config } from '../../main/utils/constants/constants';
import { processManager } from '../../main/utils/ProcessManager';
import { BankUserCopy } from '../../main/finance/BankUser/BankUserCopy';
import { MockMessage } from './classes/MockMessage';
import { MockDiscordUser } from './classes/MockDiscordUser';
import { MockTextChannel } from './classes/MockTextChannel';

export const tempBankUserStore: BankUserCopy[] = [];
export const USER_BOT = new MockDiscordUser(config.BOT_ID, 'db-bank');
function init() {
    commandHandler.loadAllCommands();
    const BOT_TEXT_CHANNEL = new MockTextChannel();
    BOT_TEXT_CHANNEL.messages = {
        fetch: async (id: string) => {
            if (id === '1090453246314815582') return undefined;
            return new MockMessage('', '', USER_BOT);
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

// global declarations
init();

describe('env setup', () => {
    it('token', () => {
        const myVariable = process.env.CLIENT_TOKEN;
        expect(myVariable).toBe('test_token'); // this value was defined in test-setup.ts
    });
});
