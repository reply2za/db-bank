import { TestMessage } from './TestMessage';
import { USER_BOT } from '../constants';
import { Collection, EmbedBuilder } from 'discord.js';

export class TestTextChannel {
    receivedMessages: string[] = [];
    id: string;
    name: string;
    messages: { fetch: () => Promise<TestMessage> } | undefined;
    awaitMessagesList: TestMessage[][] | undefined;
    constructor(id?: string, name = '') {
        if (!id) {
            this.id = (Math.random() * 100000 + 1).toString();
        } else {
            this.id = id;
        }
        this.name = name;
    }
    send(message: string | { embeds: [EmbedBuilder] }) {
        let messageText = '';
        if (typeof message === 'object') {
            messageText = message.embeds[0].data.description || 'no description';
            this.receivedMessages.push(messageText);
        } else {
            this.receivedMessages.push(message);
            messageText = message;
        }
        const randomId = Math.floor(Math.random() * 1000000);
        return new TestMessage(randomId.toString(), messageText, USER_BOT, this);
    }

    async awaitMessages(...args: any[]) {
        const messages = this.awaitMessagesList?.shift();
        if (!messages) {
            console.log('no messages to await');
            throw new Error('No messages to await');
        }
        const c = new Collection();
        for (const message of messages) {
            c.set(message.id, message);
        }
        return c;
    }
}
