import { ABankUser } from '../BankUser/ABankUser';
import { TextChannel } from 'discord.js';
import { processManager } from '../../utils/ProcessManager';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { bank } from '../Bank';
import { ApprovedChargeTransfer } from '../Transfer/ApprovedChargeTransfer';

export class BidEvent {
    private highestBidder: BankUserCopy | null;
    private minBidAmount = 0.5;
    private minBidIncrement = 0.5;
    private textChannel: TextChannel;
    private currentBidAmount = 0;
    private maxBidAmount = 50;
    private endDateTime: Date | null = BidEvent.defaultDateTime();
    private static readonly FAILED_CHARGE_TXT = 'charge failed, could not find user in the database';
    private description: string | undefined;

    public constructor(textChannel: TextChannel, description?: string) {
        this.textChannel = textChannel;
        this.description = description;
    }

    private static defaultDateTime(): Date {
        const date = new Date();
        date.setHours(17, 29, 59, 999);
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
            await this.textChannel.send(`You are already the highest bidder with a bid of ${this.currentBidAmount}`);
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
        await this.textChannel.send(`Bid of ${bidAmount} has been placed by ${bidder.getUsername()}`);
    }

    public reset(): void {
        this.highestBidder = null;
        this.currentBidAmount = 0;
        this.endDateTime = null;
    }

    public async startBidding(date?: Date): Promise<void> {
        if (date) this.endDateTime = date;
        if (!this.endDateTime || this.endDateTime < new Date()) {
            this.endDateTime = BidEvent.defaultDateTime();
        }
        setTimeout(() => {
            if (processManager.isActive()) this.endBidding();
            else this.reset();
        }, this.endDateTime.getTime() - Date.now());
        await this.textChannel.send(`Bidding has started and will end on ${this.endDateTime.toLocaleString()}`);
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
}
