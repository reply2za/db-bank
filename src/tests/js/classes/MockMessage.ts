import { MockDiscordUser } from './MockDiscordUser';
import { MockTextChannel } from './MockTextChannel';

export class MockMessage {
    receivedMessages: string[] = [];
    content: string;
    author: MockDiscordUser;
    deleteable = true;
    id: string;
    channel: MockTextChannel;
    reactionsList: any[] = [];
    constructor(id = '', content = '', author: MockDiscordUser, channel?: MockTextChannel) {
        if (!id) {
            this.id = (Math.random() * 1000000 + 1).toString();
        } else {
            this.id = id;
        }
        this.content = content;
        this.author = author;
        this.channel = channel || new MockTextChannel();
    }
    static getBuilder(): MockMessageBuilder {
        return new MockMessageBuilder();
    }
    async edit(message: string) {
        this.content = message;
        return this;
    }

    async delete() {
        this.deleteable = false;
        return;
    }
    async react(...args: any[]) {
        this.reactionsList.push(args[0]);
        return;
    }
    createReactionCollector(...args: any[]) {
        return {
            on: (...args: any[]) => {
                return;
            },
            stop: (reason?: string) => {
                return;
            },
        };
    }
}

class MockMessageBuilder {
    id: string;
    content: string;
    user: MockDiscordUser | undefined;
    constructor(id = '', content = '') {
        this.id = id;
        this.content = content;
    }
    build(): MockMessage {
        if (!this.user) throw new Error('User not set');
        return new MockMessage(this.id, this.content, this.user);
    }

    setId(id: string): MockMessageBuilder {
        this.id = id;
        return this;
    }
    setContent(content: string): MockMessageBuilder {
        this.content = content;
        return this;
    }
    setAuthor(user: MockDiscordUser): MockMessageBuilder {
        this.user = user;
        return this;
    }
    async delete() {
        return;
    }
}
