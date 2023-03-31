"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OriginalBankUser = void 0;
var numberUtils_1 = require("../../utils/numberUtils");
var ABankUser_1 = require("./ABankUser");
var BankUserCopy_1 = require("./BankUserCopy");
var OriginalBankUser = /** @class */ (function (_super) {
    __extends(OriginalBankUser, _super);
    function OriginalBankUser(discordUser, name, balance) {
        return _super.call(this, discordUser, name, balance) || this;
    }
    OriginalBankUser.prototype.addBalance = function (amount) {
        this.balance += amount;
        this.balance = (0, numberUtils_1.roundNumberTwoDecimals)(this.balance);
        return this.balance;
    };
    OriginalBankUser.prototype.subtractBalance = function (amount) {
        this.balance -= amount;
        this.balance = (0, numberUtils_1.roundNumberTwoDecimals)(this.balance);
        return this.balance;
    };
    OriginalBankUser.prototype.getBankUserCopy = function () {
        return new BankUserCopy_1.BankUserCopy(this.discordUser, this.name, this.balance);
    };
    return OriginalBankUser;
}(ABankUser_1.ABankUser));
exports.OriginalBankUser = OriginalBankUser;
