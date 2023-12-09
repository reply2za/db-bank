import { BidEvent } from './BidEvent';

class BidManager {
    // map of channel id to BidEvent
    #bidEvents: Map<string, BidEvent> = new Map();

    /**
     * Get the BidEvent for a channel.
     * @param channelId The channel id.
     */
    getBidEvent(channelId: string): BidEvent | undefined {
        return this.#bidEvents.get(channelId);
    }

    /**
     * Add a new BidEvent.
     * @param channelId The channel id.
     * @param bidEvent The BidEvent.
     */
    addBidEvent(channelId: string, bidEvent: BidEvent): void {
        if (this.#bidEvents.has(channelId)) {
            throw new Error('BidEvent already exists for this channel');
        }
        this.#bidEvents.set(channelId, bidEvent);
    }

    /**
     * Remove a BidEvent.
     * @param channelId The channel id.
     */
    removeBidEvent(channelId: string): void {
        this.#bidEvents.get(channelId)?.endBidding();
        this.#bidEvents.delete(channelId);
    }
}

export const bidManager = new BidManager();
