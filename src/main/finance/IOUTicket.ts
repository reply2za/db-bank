import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '../utils/utils';

type SimpleUser = {
    id: string;
    name: string;
};

const IOU_TICKET_WORTH_MIN = 15;
const ONE_MONTH_IN_DAYS = 30;
const MAX_IOU_EXPIRATION_DAYS = 270;

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
        this.quantity = Math.floor(quantity || 1);
        if (expirationDate) {
            this.expirationDate = expirationDate;
        } else {
            this.expirationDate = formatDate(IOUTicket.setExpirationDate(this.quantity));
        }
        this.comment = comment;
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
     * Given a date, returns the standard IOU expiration date. Default for a single IOU is 3 months.
     * Every complete hour of work yields an additional month up to MAX_IOU_EXPIRATION_DAYS.
     * @param quantity The number of IOUs in the request.
     */
    static setExpirationDate(quantity: number): Date {
        const date: Date = new Date();
        const hoursOfWork = Math.floor((quantity * IOU_TICKET_WORTH_MIN) / 60);
        // every additional hour yields 30 more days to redeem
        let days = hoursOfWork * ONE_MONTH_IN_DAYS + 3 * ONE_MONTH_IN_DAYS;
        if (days > MAX_IOU_EXPIRATION_DAYS) days = MAX_IOU_EXPIRATION_DAYS;
        date.setDate(date.getDate() + days);
        return date;
    }
}

export { IOUTicket };
