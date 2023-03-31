import { Client, GatewayIntentBits, Partials } from 'discord.js';
// the db bot instance
export const bot: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

export const isDevMode = process.argv.includes('--dev');

export const HARDWARE_TAG = process.env.HARDWARE_TAG?.replace(/\\n/gm, '\n') || `unnamed${process.pid.toString()[0]}`;

let adminIDs = ['443150640823271436 '];
if (isDevMode) {
    adminIDs.push('799524729173442620 ');
}

export const PREFIX = isDevMode ? '!' : '$';

// IDs followed by a space (test: 799524729173442620)
export const ADMIN_IDS = Object.freeze(adminIDs);

export const TRANSACTION_LOG_CH_ID = isDevMode ? '1081761590292009041' : '1062859204177698958';
export const INFO_LOG_CH_ID = isDevMode ? '1081761590292009041' : '1070859598627610746';
export const ERROR_LOG_CH_ID = '1064628593772220488';

export const MAX_IOU_COUNT_PER_REQ = 99;

export const DATA_FILE = 'localData.txt';
