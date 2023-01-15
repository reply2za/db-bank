type SimpleUser = {
    id: string;
    name: string;
};

class IOUTicket {
    sender: SimpleUser;
    receiver: SimpleUser;
    // in format MM/DD/YY
    date;
    comment;

    constructor(sender: SimpleUser, receiver: SimpleUser, date: string, comment: string) {
        this.sender = sender;
        this.receiver = receiver;
        this.date = date;
        this.comment = comment;
    }
}

export { IOUTicket };
