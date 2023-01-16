import { v4 as uuidv4 } from 'uuid';

type SimpleUser = {
    id: string;
    name: string;
};

class IOUTicket {
    id: string;
    sender: SimpleUser;
    receiver: SimpleUser;
    // in format MM/DD/YY
    date;
    comment;

    constructor(id: string | null, sender: SimpleUser, receiver: SimpleUser, date: string, comment: string) {
        this.id = id ?? uuidv4();
        this.sender = sender;
        this.receiver = receiver;
        this.date = date;
        this.comment = comment;
    }
}

export { IOUTicket };
