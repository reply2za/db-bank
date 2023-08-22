import { EventDataNames, MessageEventLocal } from '../utils/types';
import { BankUserCopy } from '../finance/BankUser/BankUserCopy';

class PromptBasedTransferFactory {
    #processTransferMap: Map<string, (event: MessageEventLocal, otherUser: BankUserCopy) => Promise<void>> = new Map();
    get(classType: any): (event: MessageEventLocal) => Promise<void> {
        const processTransfer = this.#processTransferMap.get(classType.name);
        if (!processTransfer) throw new Error('Invalid class type');
        if (classType.getUserToTransferTo.length != 3) throw new Error('invalid getUserToTransferTo method');
        return async (event: MessageEventLocal) => {
            event.data.set(EventDataNames.AUTHOR_INTERACT_HISTORY, event.bankUser.getHistory());
            const otherUser = await classType.getUserToTransferTo(event.message, event.args.join(' '), event.data);
            if (!otherUser) return;
            await processTransfer(event, otherUser);
            return;
        };
    }

    add(
        classType: any,
        processTransfer: (event: MessageEventLocal, otherUser: BankUserCopy) => Promise<void>
    ): (event: MessageEventLocal) => Promise<void> {
        if (typeof classType !== 'function') throw new Error('Invalid class type');
        this.#processTransferMap.set(classType.name, processTransfer);
        return this.get(classType);
    }
}

const transferFactory = new PromptBasedTransferFactory();
export { transferFactory };
