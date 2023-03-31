"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDataNames = void 0;
var EventDataNames;
(function (EventDataNames) {
    /*
    Message - active message object from the bot when starting a transfer
    - is created when a transfer message/request from the bot is sent
    - is deleted when a response is provided or timeouts
    */
    EventDataNames[EventDataNames["INITIAL_TRANSFER_MSG"] = 0] = "INITIAL_TRANSFER_MSG";
    /*
    {id: string, cmdName: string} - reaction transfer request id & command name
    - is created only when a transfer request is initiated from a reaction
    - is deleted when the request is complete
     */
    EventDataNames[EventDataNames["REACTION_TSFR_REQ"] = 1] = "REACTION_TSFR_REQ";
    /*
    Message - The message that contains the Redeemable IOU Embed
    - is created when a redeem request is initiated from a reaction
     */
    EventDataNames[EventDataNames["REDEEM_IOU_EMBED_MSG"] = 2] = "REDEEM_IOU_EMBED_MSG";
})(EventDataNames = exports.EventDataNames || (exports.EventDataNames = {}));
