import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '../utils/utils';

type SimpleUser = {
    id: string;
    name: string;
};

class IOUTicket {
    readonly id: string;
    readonly sender: SimpleUser;
    readonly receiver: SimpleUser;
    // in format MM/DD/YY
    readonly date;
    // in format MM/DD/YY
    readonly expirationDate;
    readonly comment;
    // the amount of IOUs
    readonly quantity;

    constructor(
        id: string | null,
        sender: SimpleUser,
        receiver: SimpleUser,
        date: string,
        expirationDate: string,
        comment: string,
        quantity: number
    ) {
        this.id = id ?? uuidv4();
        this.sender = sender;
        this.receiver = receiver;
        this.date = date;
        if (expirationDate) {
            this.expirationDate = expirationDate;
        } else {
            this.expirationDate = formatDate(IOUTicket.setExpirationDate(new Date()));
        }
        this.comment = comment;
        this.quantity = Math.floor(quantity || 1);
        if (this.quantity < 1) throw new Error('IOU quantity must be a positive integer');
    }

    cloneWithNewQuantity(quantity: number) {
        return new IOUTicket(
            this.id,
            this.sender,
            this.receiver,
            this.date,
            this.expirationDate,
            this.comment,
            quantity
        );
    }

    getSerializableData() {
        return {
            id: this.id,
            sender: this.sender,
            receiver: this.receiver,
            date: this.date,
            expDate: this.expirationDate,
            comment: this.comment,
            quantity: this.quantity,
        };
    }

    /**
     * Given a date, returns the standard IOU expiration date.
     * @param date
     */
    static setExpirationDate(date: Date): Date {
        // add 9 months
        date.setDate(date.getDate() + 270);
        return date;
    }
}

export { IOUTicket };
