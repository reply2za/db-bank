import { BidEvent } from './BidEvent';

class BidManager {
    // map of channel id to BidEvent
    #activeBidEvents: Map<string, BidEvent> = new Map();
    #pausedBidEvents: Map<string, Array<BidEvent>> = new Map();

    /**
     * Get the BidEvent for a channel.
     * @param channelId The channel id.
     */
    getBidEvent(channelId: string): BidEvent | undefined {
        return this.#activeBidEvents.get(channelId);
    }

    /**
     * Add a new BidEvent.
     * @param channelId The channel id.
     * @param bidEvent The BidEvent.
     */
    addBidEvent(channelId: string, bidEvent: BidEvent): void {
        if (this.#activeBidEvents.has(channelId)) {
            throw new Error('BidEvent already exists for this channel');
        }
        this.#activeBidEvents.set(channelId, bidEvent);
    }

    async resumeBidEvent(channelId: string): Promise<boolean> {
        const bidEvent = this.#activeBidEvents.get(channelId);
        if (bidEvent) {
            if (!bidEvent.hasEnded()) {
                return false;
            } else if (bidEvent.hasUserBeenCharged()) {
                this.#activeBidEvents.delete(channelId);
            }
        }
        const pausedBidEvents = this.#pausedBidEvents.get(channelId);
        if (pausedBidEvents && pausedBidEvents.length) {
            const bidEvent = pausedBidEvents.pop();
            if (bidEvent) {
                await bidEvent.resume();
                this.#activeBidEvents.set(channelId, bidEvent);
                return true;
            }
        }
        return false;
    }

    pauseBidEvent(channelId: string): boolean {
        const bidEvent = this.#activeBidEvents.get(channelId);
        if (bidEvent) {
            bidEvent.pause();
            if (this.#pausedBidEvents.has(channelId)) {
                this.#pausedBidEvents.get(channelId)!.push(bidEvent);
            } else {
                this.#pausedBidEvents.set(channelId, [bidEvent]);
            }
            this.#activeBidEvents.delete(channelId);
            return true;
        }
        return false;
    }

    async deleteBidEvent(channelId: string): Promise<boolean> {
        const bidEvent = this.#activeBidEvents.get(channelId);
        if (bidEvent) {
            await bidEvent.cancelBidding();
            this.#activeBidEvents.delete(channelId);
            return true;
        }
        return false;
    }
}

export const bidManager = new BidManager();
