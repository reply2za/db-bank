import { Transfer } from './Transfer';
import { calculateTotal } from '../utils';
import { EmbedBuilderLocal } from '@hoursofza/djs-common';
import { Colors, TextChannel } from 'discord.js';
import { getUserResponse } from '../../utils/utils';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import cashTransferVisualizer from '../visualizers/transfers/cashTransferVisualizer';

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

    protected async postSuccessfulTransferAction(
        sender: BankUserCopy,
        receiver: BankUserCopy,
        transferAmount: number,
        comment: string,
        channel: TextChannel
    ): Promise<void> {
        await receiver.getDiscordUser().send({
            embeds: [
                cashTransferVisualizer
                    .getTransferNotificationEmbed(sender.getUsername(), receiver, transferAmount, comment)
                    .build(),
            ],
        });
        await cashTransferVisualizer.getTransferReceiptEmbed(receiver.getUsername(), transferAmount).send(channel);
    }
}
