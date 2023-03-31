"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_FILE = exports.MAX_IOU_COUNT_PER_REQ = exports.ERROR_LOG_CH_ID = exports.INFO_LOG_CH_ID = exports.TRANSACTION_LOG_CH_ID = exports.ADMIN_IDS = exports.PREFIX = exports.HARDWARE_TAG = exports.isDevMode = exports.bot = void 0;
var discord_js_1 = require("discord.js");
// the db bot instance
exports.bot = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildInvites,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.GuildPresences,
        discord_js_1.GatewayIntentBits.GuildIntegrations,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.GuildMessageReactions,
        discord_js_1.GatewayIntentBits.DirectMessageReactions,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    partials: [discord_js_1.Partials.Message, discord_js_1.Partials.Channel, discord_js_1.Partials.Reaction, discord_js_1.Partials.User],
});
exports.isDevMode = process.argv.includes('--dev');
exports.HARDWARE_TAG = ((_a = process.env.HARDWARE_TAG) === null || _a === void 0 ? void 0 : _a.replace(/\\n/gm, '\n')) || "unnamed".concat(process.pid.toString()[0]);
var adminIDs = ['443150640823271436 '];
if (exports.isDevMode) {
    adminIDs.push('799524729173442620 ');
}
exports.PREFIX = exports.isDevMode ? '!' : '$';
// IDs followed by a space (test: 799524729173442620)
exports.ADMIN_IDS = Object.freeze(adminIDs);
exports.TRANSACTION_LOG_CH_ID = exports.isDevMode ? '1081761590292009041' : '1062859204177698958';
exports.INFO_LOG_CH_ID = exports.isDevMode ? '1081761590292009041' : '1070859598627610746';
exports.ERROR_LOG_CH_ID = '1064628593772220488';
exports.MAX_IOU_COUNT_PER_REQ = 99;
exports.DATA_FILE = 'localData.txt';
