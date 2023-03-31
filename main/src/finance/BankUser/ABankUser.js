"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABankUser = void 0;
var ABankUser = /** @class */ (function () {
    function ABankUser(discordUser, name, balance) {
        this.userId = discordUser.id;
        this.name = name;
        this.balance = balance;
        this.discordUser = discordUser;
    }
    ABankUser.prototype.getUserId = function () {
        return this.userId;
    };
    ABankUser.prototype.getBalance = function () {
        return this.balance;
    };
    ABankUser.prototype.getDiscordUser = function () {
        return this.discordUser;
    };
    /**
     * The discord username.
     */
    ABankUser.prototype.getUsername = function () {
        return this.discordUser.username;
    };
    /**
     * A name that should be used for the database / logs.
     * This may not be their latest discord username.
     */
    ABankUser.prototype.getDBName = function () {
        return this.name;
    };
    ABankUser.prototype.getSerializableData = function () {
        return {
            userId: this.userId,
            name: this.name,
            balance: this.balance,
        };
    };
    return ABankUser;
}());
exports.ABankUser = ABankUser;
