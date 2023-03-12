import { v4 as uuidv4 } from 'uuid';

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
    readonly comment;
    // the amount of IOUs
    readonly quantity;

    constructor(
        id: string | null,
        sender: SimpleUser,
        receiver: SimpleUser,
        date: string,
        comment: string,
        quantity: number
    ) {
        this.id = id ?? uuidv4();
        this.sender = sender;
        this.receiver = receiver;
        this.date = date;
        this.comment = comment;
        this.quantity = Math.floor(quantity || 1);
        if (this.quantity < 1) throw new Error('IOU quantity must be a positive integer');
    }

    cloneWithNewQuantity(quantity: number) {
        return new IOUTicket(this.id, this.sender, this.receiver, this.date, this.comment, quantity);
    }
}

export { IOUTicket };
