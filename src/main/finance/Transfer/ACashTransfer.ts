import { Transfer } from './Transfer';
import { calculateTotal } from '../utils';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { Colors } from 'discord.js';
import { getUserResponse } from '../../utils/utils';

/**
 * Any type of transfer that is done in cash.
 */
export abstract class ACashTransfer extends Transfer {
    protected async promptForAmount(): Promise<string | undefined> {
        let amt = await super.promptForAmount();
        if (amt) {
            if (amt.charAt(0) === '$') amt = amt.replace('$', '');
            amt = amt.replaceAll(',', '');
            if (amt.includes('+') || amt.includes('-')) {
                amt = calculateTotal(amt);
            }
        }
        return amt;
    }

    protected async getComment(): Promise<string | undefined> {
        await new EmbedBuilderLocal()
            .setDescription("type a short comment/description ['b' = blank, 'q' = cancel]")
            .setColor(Colors.Orange)
            .send(this.channel);
        const commentResponse = (await getUserResponse(this.channel, this.responder.getUserId()))?.content;
        if (commentResponse?.toLowerCase() === 'b') return '';
        return commentResponse;
    }
}
