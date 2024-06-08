import { roundNumberTwoDecimals } from '../../utils/numberUtils';
import { getCurrentMoment } from '../../utils/utils';
import { ABankUser } from './ABankUser';
import { BankUserCopy } from './BankUserCopy';

class OriginalBankUser extends ABankUser {
    addBalance(amount: number) {
        this.balance.value += amount;
        this.balance.value = roundNumberTwoDecimals(this.balance.value);
        return this.balance;
    }

    subtractBalance(amount: number) {
        this.balance.value -= amount;
        this.balance.value = roundNumberTwoDecimals(this.balance.value);
        return this.balance;
    }

    getBankUserCopy(): BankUserCopy {
        const bankUser = new BankUserCopy(this.discordUser, this.name, this.balance, this.history);
        bankUser.setMaxBid(this.getMaxBid(getCurrentMoment()));
        return bankUser;
    }
}

export { OriginalBankUser };
