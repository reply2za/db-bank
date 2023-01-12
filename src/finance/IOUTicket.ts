

class IOUTicket {
    senderID;
    receiverID;
    date;
    comment;

    constructor(senderID: string, receiverID: string, date:string, comment:string) {
        this.senderID = senderID;
        this.receiverID = receiverID;
        this.date = date;
        this.comment = comment;
    }

}

export {IOUTicket}

