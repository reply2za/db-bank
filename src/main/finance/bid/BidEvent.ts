import { ABankUser } from '../BankUser/ABankUser';
import { TextChannel } from 'discord.js';
import { processManager } from '../../utils/ProcessManager';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { bank } from '../Bank';
import { ApprovedChargeTransfer } from '../Transfer/ApprovedChargeTransfer';
import { DayOfTheWeek } from '../../utils/enums';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';

export class BidEvent {
    private highestBidder: BankUserCopy | null;
    private currentBidAmount = 0;
    private endDateTime: Date | null = BidEvent.defaultDateTime();
    private static readonly DEFAULT_MIN_BID_AMOUNT = 0.25;
    private static readonly DEFAULT_MIN_BID_INCREMENT = 0.25;
    private minBidAmount = BidEvent.DEFAULT_MIN_BID_AMOUNT;
    private minBidIncrement = BidEvent.DEFAULT_MIN_BID_INCREMENT;
    private textChannel: TextChannel;
    private maxBidAmount = 50;
    private static readonly FAILED_CHARGE_TXT = 'charge failed, could not find user in the database';
    private description: string;
    private bidTimeout: NodeJS.Timeout | null = null;
    private dailyBidConfigs: Map<DayOfTheWeek, DailyBidConfig> = new Map();
    private cooldown_minutes = 5;

    public constructor(textChannel: TextChannel, description = 'bid') {
        this.textChannel = textChannel;
        this.description = description;
    }

    private static defaultDateTime(): Date {
        const date = new Date();
        date.setHours(23, 59, 59, 999);
        return date;
    }

    public getCurrentBidAmount(): number {
        return this.currentBidAmount;
    }

    public getHighestBidder(): ABankUser | null {
        return this.highestBidder;
    }
    public setHighestBidder(bidder: ABankUser): void {
        this.highestBidder = bidder;
    }
    public setEndDateTime(endDateTime: Date): void {
        this.endDateTime = endDateTime;
    }
    public getEndDateTime(): Date | null {
        return this.endDateTime;
    }
    public getMinBidAmount(): number {
        return this.minBidAmount;
    }
    public getMinBidIncrement(): number {
        return this.minBidIncrement;
    }

    public async addBid(bidder: BankUserCopy, bidAmount: number): Promise<void> {
        if (this.highestBidder?.getUserId() === bidder.getUserId()) {
            await this.textChannel.send(`You are already the highest bidder with a bid of $${this.currentBidAmount}`);
            return;
        }
        if (bidAmount < this.minBidAmount) {
            await this.textChannel.send(`Bid must be at least ${this.minBidAmount}`);
            return;
        }
        if (bidAmount < this.currentBidAmount + this.minBidIncrement) {
            await this.textChannel.send(`Next bid must be at least ${this.currentBidAmount + this.minBidIncrement}`);
            return;
        }
        if (bidAmount > this.maxBidAmount) {
            await this.textChannel.send(`Bid must be less than ${this.maxBidAmount}`);
            return;
        }
        this.highestBidder = bidder;
        this.currentBidAmount = bidAmount;
        await this.textChannel.send(`Bid of ${bidAmount} has been placed by $${bidder.getUsername()}`);
    }

    public setDescription(description: string): void {
        this.description = description;
    }

    public getDescription(): string {
        return this.description;
    }

    public reset(): void {
        if (this.bidTimeout) clearTimeout(this.bidTimeout);
        this.endDateTime = null;
        this.highestBidder = null;
        this.currentBidAmount = 0;
    }

    public hasEnded() {
        return this.endDateTime && this.endDateTime < new Date();
    }

    public async startBidding(date?: Date): Promise<void> {
        if (date) this.endDateTime = date;
        const currentDate = new Date();
        if (this.endDateTime && this.endDateTime < currentDate) {
            // create a new date with the cooldown time added
            const cooldownExpiryDate = new Date(this.endDateTime.getTime());
            cooldownExpiryDate.setMinutes(cooldownExpiryDate.getMinutes() + this.cooldown_minutes);
            if (cooldownExpiryDate > currentDate) {
                await this.textChannel.send(
                    `Bidding has ended, bidding will be available again at ${cooldownExpiryDate.toLocaleString()}`
                );
                return;
            }
        }
        if (!this.endDateTime || this.endDateTime < currentDate) {
            this.endDateTime = BidEvent.defaultDateTime();
        }

        this.bidTimeout = setTimeout(() => {
            if (processManager.isActive()) this.endBidding();
            else this.reset();
        }, this.endDateTime.getTime() - Date.now());
        // set the configs based on the ending date
        const day = this.endDateTime.getDay();
        const dailyBidConfig = this.dailyBidConfigs.get(day);
        if (dailyBidConfig) {
            this.minBidAmount = dailyBidConfig.minBidAmount;
            this.minBidIncrement = dailyBidConfig.minBidIncrement;
        } else {
            this.minBidAmount = BidEvent.DEFAULT_MIN_BID_AMOUNT;
            this.minBidIncrement = BidEvent.DEFAULT_MIN_BID_INCREMENT;
        }
        await new EmbedBuilderLocal()
            .setTitle('Bidding: ' + this.description)
            .setDescription(`starting bid: $${this.minBidAmount}\nminimum increment: $${this.minBidIncrement}`)
            .setFooter(`ends ${this.endDateTime.toLocaleString()}`)
            .send(this.textChannel);
    }

    public async endBidding(): Promise<void> {
        if (this.highestBidder) {
            const msg = await this.textChannel.send(
                'Bidding has ended, the winner is: ' +
                    this.highestBidder.getUsername() +
                    ' with a bid of ' +
                    this.currentBidAmount
            );
            const dbBank = bank.getUserCopy(msg.author.id);
            let userToTransferTo = dbBank;
            if (!dbBank) {
                const userToTransferTo = bank.getUserCopy('443150640823271436');
                if (userToTransferTo) {
                    await userToTransferTo.getDiscordUser().send(BidEvent.FAILED_CHARGE_TXT);
                }
            }
            if (!userToTransferTo) {
                await this.textChannel.send(BidEvent.FAILED_CHARGE_TXT);
                return;
            }
            // use the bank to charge the winner
            await new ApprovedChargeTransfer(this.textChannel, this.highestBidder!, userToTransferTo).processTransfer(
                this.currentBidAmount,
                this.description || 'bid'
            );
        }
        this.reset();
    }

    public async cancelBidding(): Promise<void> {
        if (this.bidTimeout) clearTimeout(this.bidTimeout);
        this.reset();
        await this.textChannel.send('Bidding has been cancelled');
    }

    public setDailyBidConfig(day: DayOfTheWeek, config: DailyBidConfig): void {
        this.dailyBidConfigs.set(day, config);
    }
}

export type DailyBidConfig = {
    minBidAmount: number;
    minBidIncrement: number;
};