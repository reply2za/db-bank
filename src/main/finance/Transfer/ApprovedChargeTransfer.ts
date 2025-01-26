import { TextChannel } from 'discord.js';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { ChargeTransfer } from './ChargeTransfer';
const CONFIRMATION_BUFFER = 2000;
export class ApprovedChargeTransfer extends ChargeTransfer {
    constructor(channel: TextChannel, sender: BankUserCopy, receiver: BankUserCopy) {
        super(channel, sender, receiver);
    }

    protected override async getFinalConfirmation(): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, CONFIRMATION_BUFFER);
        });
    }
}
