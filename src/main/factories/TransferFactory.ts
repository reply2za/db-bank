import { EventDataNames, MessageEventLocal } from '../utils/types';
import { BankUserCopy } from '../finance/BankUser/BankUserCopy';
import { Transfer } from '../finance/Transfer/Transfer';

class TransferFactory {
    /**
     * Returns a function that will create a transfer object and process it.
     * This is the default implementation of a transfer request.
     * @param classType
     * @param classBuilder
     */
    static get(
        classType: typeof Transfer,
        classBuilder: (event: MessageEventLocal, otherUser: BankUserCopy) => Transfer
    ): (event: MessageEventLocal) => Promise<void> {
        if (typeof classType !== 'function') throw new Error('Invalid class type');
        if (!classBuilder) throw new Error('Invalid class type');
        if (classType.getUserToTransferTo.length != 3) throw new Error('invalid getUserToTransferTo method');
        return async (event: MessageEventLocal) => {
            event.data.set(EventDataNames.AUTHOR_INTERACT_HISTORY, event.bankUser.getHistory());
            const otherUser = await classType.getUserToTransferTo(event.message, event.args.join(' '), event.data);
            if (!otherUser) return;
            await classBuilder(event, otherUser).processTransfer();
            return;
        };
    }
}

export { TransferFactory };
