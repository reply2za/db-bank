import { User } from 'discord.js';

export abstract class ABankUser {
    protected readonly userId: string;
    protected readonly name: string;
    protected readonly discordUser: User;
    protected balance: number;

    protected constructor(discordUser: User, name: string, balance: number) {
        this.userId = discordUser.id;
        this.name = name;
        this.balance = balance;
        this.discordUser = discordUser;
    }

    getUserId() {
        return this.userId;
    }

    getBalance(): number {
        return this.balance;
    }

    getDiscordUser(): Readonly<User> {
        return this.discordUser;
    }

    getName(): string {
        return this.discordUser.username;
    }

    getSerializableData() {
        return {
            userId: this.userId,
            name: this.name,
            balance: this.balance,
        };
    }
}
