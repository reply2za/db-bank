import { ABankUser } from '../BankUser/ABankUser';
import { TextChannel } from 'discord.js';
import { processManager } from '../../utils/ProcessManager';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { bank } from '../Bank';
import { ApprovedChargeTransfer } from '../Transfer/ApprovedChargeTransfer';
import { DayOfTheWeek } from '../../utils/enums';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import moment from 'moment';
import { getCurrentMoment } from '../../utils/utils';

export class BidEvent {
    private highestBidder: BankUserCopy | null;
    private currentBidAmount = 0;
    private endDateTime: string | null = BidEvent.defaultDateTime().toISOString();
    private static readonly DEFAULT_MIN_BID_AMOUNT = 0.25;
    private static readonly DEFAULT_MIN_BID_INCREMENT = 0.25;
    private minBidAmount = BidEvent.DEFAULT_MIN_BID_AMOUNT;
    private minBidIncrement = BidEvent.DEFAULT_MIN_BID_INCREMENT;
    private textChannel: TextChannel;
    private maxBidAmount = 100;
    private static readonly FAILED_CHARGE_TXT = 'charge failed, could not find user in the database';
    private description: string;
    private bidTimeout: NodeJS.Timeout | null = null;
    private dailyBidConfigs: Map<DayOfTheWeek, DailyBidConfig> = new Map();
    private cooldown_minutes = 5;
    private userHasBeenCharged = false;

    public constructor(textChannel: TextChannel, description = 'bid') {
        this.textChannel = textChannel;
        this.description = description;
    }

    public static defaultDateTime(): moment.Moment {
        return getCurrentMoment().endOf('day');
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
    public setEndDateTime(endDateTime: moment.Moment): void {
        this.endDateTime = endDateTime.toISOString();
    }
    public getEndDateTime(): moment.Moment | null {
        if (!this.endDateTime) return null;
        return moment(this.endDateTime);
    }
    public getMinBidAmount(): number {
        return this.minBidAmount;
    }
    public getMinBidIncrement(): number {
        return this.minBidIncrement;
    }

    public async addBid(bidder: BankUserCopy, bidAmount: number): Promise<void> {
        if (this.hasEnded()) {
            await this.textChannel.send('Bidding has ended');
            return;
        }
        if (this.highestBidder?.getUserId() === bidder.getUserId()) {
            await this.textChannel.send(`You are already the highest bidder with a bid of $${this.currentBidAmount}`);
            return;
        }
        const digitCheck = Number(bidAmount.toFixed(2));
        if (bidAmount !== digitCheck) {
            await this.textChannel.send(`You can only bid up to two decimal places`);
            return;
        }
        if (bidAmount < this.minBidAmount) {
            await this.textChannel.send(`Bid must be at least $${this.minBidAmount}`);
            return;
        }
        if (bidAmount < this.currentBidAmount + this.minBidIncrement) {
            await this.textChannel.send(`Next bid must be at least $${this.currentBidAmount + this.minBidIncrement}`);
            return;
        }
        if (bidAmount > this.maxBidAmount) {
            await this.textChannel.send(`Bid must be less than $${this.maxBidAmount}`);
            return;
        }
        const previousBidderMaxBid = this.highestBidder?.getMaxBid(getCurrentMoment());
        const newOutbidMin = bidAmount + this.minBidIncrement;
        if (previousBidderMaxBid && previousBidderMaxBid > 0 && 
            previousBidderMaxBid < newOutbidMin && previousBidderMaxBid >= this.currentBidAmount) {
                const outbidderName = bidder.getDiscordUser().displayName || bidder.getDiscordUser().username;
                this.highestBidder?.getDiscordUser().send(outbidderName + " surpassed your max bid of $" + previousBidderMaxBid);
        }
        this.highestBidder = bidder;
        this.currentBidAmount = bidAmount;
        await new EmbedBuilderLocal()
            .setDescription(`Bid of $${bidAmount} has been placed by ${bidder.getUsername()}`)
            .setColor('#007000')
            .send(this.textChannel);
        this.checkMaxBids();
    }

    private checkMaxBids() {
        if (!this.highestBidder || !this.description.includes("VIP TV access for")) return;
        const date = getCurrentMoment();
        const resUsers = bank.getAllUsers().filter(i => {
            return (i.getUserId() !== this.highestBidder!.getUserId() &&
            i.getMaxBid(date) >= (this.currentBidAmount + this.minBidIncrement));
        }); 
        let earliestBidDate = getCurrentMoment().add(1,'second');
        let earliestUser: BankUserCopy | null = null; 
        resUsers.forEach(x => {
            const bidDate = x.getMaxBidDate();
            if (bidDate.isBefore(earliestBidDate, 'second')) {
                earliestBidDate = bidDate;
                earliestUser = x;
            }
        });
        if (earliestUser) {
            this.addBid(earliestUser, this.currentBidAmount + this.minBidIncrement);
        }
    }

    public setDescription(description: string): void {
        this.description = description;
    }

    public getDescription(): string {
        return this.description;
    }

    public reset(): void {
        if (this.bidTimeout) {
            clearTimeout(this.bidTimeout);
            this.bidTimeout = null;
        }
        this.endDateTime = null;
        this.highestBidder = null;
        this.currentBidAmount = 0;
        this.userHasBeenCharged = false;
    }

    public hasEnded() {
        return this.endDateTime && moment(this.endDateTime).isBefore(getCurrentMoment());
    }

    public async startBidding(newEndTime?: moment.Moment): Promise<void> {
        const currentDate = getCurrentMoment();
        if (this.endDateTime && moment(this.endDateTime).isBefore(currentDate)) {
            // create a new date with the cooldown time added
            const cooldownExpiryDate = moment(this.endDateTime);
            cooldownExpiryDate.minutes(cooldownExpiryDate.minute() + this.cooldown_minutes);
            if (cooldownExpiryDate > currentDate) {
                await this.textChannel.send(
                    `Bidding has ended, bidding will be available again at ${cooldownExpiryDate.toLocaleString()}`
                );
                return;
            }
        }
        if (!this.endDateTime || moment(this.endDateTime).isBefore(currentDate)) {
            this.endDateTime = newEndTime?.toISOString() || BidEvent.defaultDateTime().toISOString();
        }
        const diffMS = moment(this.endDateTime).diff(getCurrentMoment());
        this.bidTimeout = setTimeout(async () => {
            await this.endBidAction();
        }, diffMS);
        // set the configs based on the ending date
        const day = moment(this.endDateTime).day();
        const dailyBidConfig = this.dailyBidConfigs.get(day);
        if (dailyBidConfig) {
            this.minBidAmount = dailyBidConfig.minBidAmount;
            this.minBidIncrement = dailyBidConfig.minBidIncrement;
        } else {
            this.minBidAmount = BidEvent.DEFAULT_MIN_BID_AMOUNT;
            this.minBidIncrement = BidEvent.DEFAULT_MIN_BID_INCREMENT;
        }

        await this.getBidEmbed().send(this.textChannel);
    }

    public async endBidding(): Promise<void> {
        if (this.highestBidder) {
            const msg = await this.textChannel.send(
                'Bidding has ended, the winner is: ' +
                this.highestBidder.getUsername() +
                ' with a bid of $' +
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
            this.userHasBeenCharged = true;
        }
    }

    public async cancelBidding(): Promise<void> {
        if (this.bidTimeout) {
            clearTimeout(this.bidTimeout);
            this.bidTimeout = null;
        }
        this.reset();
    }

    public setDailyBidConfig(day: DayOfTheWeek, config: DailyBidConfig): void {
        this.dailyBidConfigs.set(day, config);
    }

    public pause(): void {
        if (this.bidTimeout) {
            clearTimeout(this.bidTimeout);
            this.bidTimeout = null;
        }
    }

    public async resume(): Promise<boolean> {
        if (this.bidTimeout) return true;
        if (!this.endDateTime) {
            return false;
        } else {
            const timeRemaining = moment(this.endDateTime).diff(getCurrentMoment());
            if (timeRemaining <= 0) {
                await this.endBidAction();
            } else {
                this.bidTimeout = setTimeout(async () => {
                    await this.endBidAction();
                }, timeRemaining);
            }
        }
        return true;
    }

    public getBidEmbed(): EmbedBuilderLocal {
        const localEndDateTime = moment(this.endDateTime).local().format('YYYY-MM-DD HH:mm:ss')
        return new EmbedBuilderLocal()
            .setTitle('Bidding: ' + this.description)
            .setDescription(`starting bid: $${this.minBidAmount}\nminimum increment: $${this.minBidIncrement}`)
            .setFooter(`ends ${localEndDateTime || 'N/A'}`);
    }

    public hasUserBeenCharged(): boolean {
        return this.userHasBeenCharged;
    }

    private async endBidAction() {
        if (processManager.isActive()) await this.endBidding();
        else this.reset();
    }
}

export type DailyBidConfig = {
    minBidAmount: number;
    minBidIncrement: number;
};
