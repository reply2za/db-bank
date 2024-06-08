import { bot, config } from '../../../main/utils/constants/constants';
import { MockDiscordUser } from './MockDiscordUser';
import { MockTextChannel } from './MockTextChannel';
import { MockMessage } from './MockMessage';
import { BankUserCopy } from '../../../main/finance/BankUser/BankUserCopy';
import { bank } from '../../../main/finance/Bank';
import { User } from 'discord.js';
import { tempBankUserStore } from '../main.test';
import { localStorage } from '../../../main/storage/LocalStorage';

export class Setup1 {
    userJoe: MockDiscordUser;
    userAnna: MockDiscordUser;
    channel1: MockTextChannel;
    messageFromJoe: MockMessage;
    messageFromAnna: MockMessage;
    bankUserJoe: BankUserCopy;
    bankUserAnna: BankUserCopy;
    data: string;

    constructor(joeMessageContent: string, annaMessageContent: string) {
        this.userJoe = new MockDiscordUser('12341', 'Joe');
        this.userAnna = new MockDiscordUser('313132', 'Anna');
        this.channel1 = new MockTextChannel('123', 'channel1');
        this.messageFromJoe = new MockMessage('131441241', `!${joeMessageContent}`, this.userJoe, this.channel1);
        this.messageFromAnna = new MockMessage('131441241', `!${annaMessageContent}`, this.userAnna, this.channel1);
        this.bankUserJoe = bank.addNewUser(<User>(<unknown>this.userJoe), 'Joe', 2324, []);
        this.bankUserAnna = bank.addNewUser(<User>(<unknown>this.userAnna), 'Anna', 131, []);
        this.data = bank.serializeData();
    }

    async reset() {
        Object.assign(tempBankUserStore, bank.getAllUsers());
        await bank.deserializeAndLoadData(this.data, bot.users);
        await localStorage.saveData(this.data);
    }
}

export class BidSetup1 {
    userA: MockDiscordUser;
    userB: MockDiscordUser;
    channel1: MockTextChannel;
    messageFromUserA: MockMessage;
    messageFromUserB: MockMessage;
    bankUserA: BankUserCopy;
    bankUserB: BankUserCopy;
    data: string;

    constructor(joeMessageContent: string, annaMessageContent: string) {
        this.userA = new MockDiscordUser('12341', 'Josephine');
        this.userB = new MockDiscordUser('313132', 'Kevin');
        this.channel1 = new MockTextChannel(config.TV_BID_CH, 'channel2');
        this.messageFromUserA = new MockMessage('131441241', `!${joeMessageContent}`, this.userA, this.channel1);
        this.messageFromUserB = new MockMessage('41389742', `!${annaMessageContent}`, this.userB, this.channel1);
        this.bankUserA = bank.addNewUser(<User>(<unknown>this.userA), 'Josephine', 2324, []);
        this.bankUserB = bank.addNewUser(<User>(<unknown>this.userB), 'Kevin', 131, []);
        this.data = bank.serializeData();
    }

    async reset() {
        Object.assign(tempBankUserStore, bank.getAllUsers());
        await bank.deserializeAndLoadData(this.data, bot.users);
        await localStorage.saveData(this.data);
    }
}
