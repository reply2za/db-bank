import { MockMessage } from './MockMessage';
import { MockTextChannel } from './MockTextChannel';

export class MockDiscordUser {
    sentMessages: string[] = [];
    id: string;
    username: string;
    #userChannel: MockTextChannel;
    constructor(id: string, username: string) {
        this.id = id;
        this.username = username;
        const channelId = (Math.random() * 100000 + 1).toString();
        this.#userChannel = new MockTextChannel(channelId, this.username);
    }
    async send(message: string) {
        this.sentMessages.push(message);
        return new MockMessage('1', message, this, this.#userChannel);
    }

    async fetch() {
        return this;
    }
}
