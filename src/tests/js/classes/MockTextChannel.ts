import { MockMessage } from './MockMessage';
import { Collection, EmbedBuilder } from 'discord.js';
import { BOT_ID } from '../../resources/constants';
import { MockDiscordUser } from './MockDiscordUser';

export class MockTextChannel {
    receivedMessages: string[] = [];
    id: string;
    name: string;
    messages: { fetch: (id: string) => Promise<MockMessage | undefined> } | undefined;
    awaitMessagesList: MockMessage[][] | undefined;
    constructor(id?: string, name = '') {
        if (!id) {
            this.id = (Math.random() * 100000 + 1).toString();
        } else {
            this.id = id;
        }
        this.name = name;
    }
    send(message: string | { embeds: [EmbedBuilder] }) {
        let messageText;
        if (typeof message === 'object') {
            messageText = message.embeds[0].data.description || 'no description';
            this.receivedMessages.push(messageText);
        } else {
            this.receivedMessages.push(message);
            messageText = message;
        }
        const randomId = Math.floor(Math.random() * 1000000);
        return new MockMessage(randomId.toString(), messageText, new MockDiscordUser(BOT_ID, 'db-bank'), this);
    }

    async awaitMessages(...args: any[]) {
        const messages = this.awaitMessagesList?.shift();
        if (!messages) {
            throw new Error('no user response');
        }
        const c = new Collection();
        for (const message of messages) {
            c.set(message.id, message);
        }
        return c;
    }

    createReactionCollector(...args: any[]) {
        return false;
    }
}
