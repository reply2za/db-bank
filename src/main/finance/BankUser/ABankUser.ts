import { User } from 'discord.js';
import { Balance } from '../../utils/wrappers/Balance';
import moment from 'moment';
import { getCurrentMoment } from '../../utils/utils';

export abstract class ABankUser {
    protected readonly userId: string;
    protected readonly name: string;
    protected readonly discordUser: User;
    protected balance: Balance;
    protected history: string[] = [];
    private static readonly MAX_HISTORY_LENGTH = 2;
    private maxBidDate: string;
    private maxBidAmount: number = -1;

    public constructor(discordUser: User, name: string, balance: Balance, history: string[] = []) {
        this.userId = discordUser.id;
        this.name = name;
        this.balance = balance;
        this.discordUser = discordUser;
        this.history = history;
    }

    getUserId() {
        return this.userId;
    }

    getMaxBid(startDate: moment.Moment): number {
        if (this.maxBidAmount > 0 && this.maxBidDate && 
            startDate.toISOString().split("T")[0] === this.getMaxBidDate().toISOString().split("T")[0]) {
            return this.maxBidAmount;
        } else {
            this.maxBidAmount = -1;
            this.maxBidDate = "";
            return this.maxBidAmount;
        };
    }

    setMaxBid(amount: number) {
        if (amount && !isNaN(amount) && amount > 0){
            this.maxBidDate = getCurrentMoment().toISOString();
            this.maxBidAmount = amount;
        }
    }

    getMaxBidDate(): moment.Moment {
        return moment(this.maxBidDate);
    }

    getBalance(): number {
        return this.balance.value;
    }

    getDiscordUser(): User {
        return this.discordUser;
    }

    /**
     * The discord username.
     */
    getUsername(): string {
        return this.discordUser.username;
    }

    /**
     * A name that should be used for the database / logs.
     * This may not be their latest discord username.
     */
    getDBName(): string {
        return this.name;
    }

    getSerializableData() {
        return {
            userId: this.userId,
            name: this.name,
            balance: this.balance.value,
            history: this.history,
        };
    }

    getHistory(): string[] {
        return this.history.slice();
    }

    addHistoryEntry(entry: string): string[] {
        let index = this.history.indexOf(entry);
        if (index !== -1) this.history.splice(index, 1);
        this.history.push(entry);
        this.history = this.history.slice(-ABankUser.MAX_HISTORY_LENGTH);
        return this.history;
    }
}
