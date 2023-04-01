import { TestMessage } from './TestMessage';
import { TestTextChannel } from './TestTextChannel';

export class TestDiscordUser {
    sentMessages: string[] = [];
    id: string;
    username: string;
    #userChannel: TestTextChannel;
    constructor(id: string, username: string) {
        this.id = id;
        this.username = username;
        const channelId = (Math.random() * 100000 + 1).toString();
        this.#userChannel = new TestTextChannel(channelId, this.username);
    }
    async send(message: string) {
        this.sentMessages.push(message);
        return new TestMessage('1', message, this, this.#userChannel);
    }

    async fetch() {
        return this;
    }
}
