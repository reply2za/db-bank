import { TestDiscordUser } from './TestDiscordUser';
import { TestTextChannel } from './TestTextChannel';

export class TestMessage {
    receivedMessages: string[] = [];
    content: string;
    author: TestDiscordUser;
    deleteable = true;
    id: string;
    channel: TestTextChannel;
    constructor(id = '', content = '', author: TestDiscordUser, channel?: TestTextChannel) {
        if (!id) {
            this.id = (Math.random() * 1000000 + 1).toString();
        } else {
            this.id = id;
        }
        this.content = content;
        this.author = author;
        this.channel = channel || new TestTextChannel();
    }
    static getBuilder(): TestMessageBuilder {
        return new TestMessageBuilder();
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
        return;
    }
}

class TestMessageBuilder {
    id: string;
    content: string;
    user: TestDiscordUser | undefined;
    constructor(id = '', content = '') {
        this.id = id;
        this.content = content;
    }
    build(): TestMessage {
        if (!this.user) throw new Error('User not set');
        return new TestMessage(this.id, this.content, this.user);
    }

    setId(id: string): TestMessageBuilder {
        this.id = id;
        return this;
    }
    setContent(content: string): TestMessageBuilder {
        this.content = content;
        return this;
    }
    setAuthor(user: TestDiscordUser): TestMessageBuilder {
        this.user = user;
        return this;
    }
    async delete() {
        return;
    }
}
