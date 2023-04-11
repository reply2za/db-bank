import { Transfer } from './Transfer';

/**
 * Any type of transfer that is done in cash.
 */
export abstract class ACashTransfer extends Transfer {
    protected async promptForAmount(): Promise<string | undefined> {
        let amt = await super.promptForAmount();
        if (amt) {
            if (amt.charAt(0) === '$') amt = amt.replace('$', '');
            amt = amt.replaceAll(',', '');
            if (amt.includes('+')) {
                const split = amt.split('+');
                let total = Number(split[0]);
                for (let i = 1; i < split.length; i++) {
                    total += Number(split[i]);
                }
                amt = total.toString();
            }
        }
        return amt;
    }
}
