import { Client, GatewayIntentBits, Partials } from 'discord.js';

const TOKEN = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');

if (!TOKEN) {
    throw new Error('missing params within .env');
}

const isDevMode = process.argv.includes('--dev');

const HARDWARE_TAG = process.env.HARDWARE_TAG?.replace(/\\n/gm, '\n') || `unnamed${process.pid.toString()[0]}`;

let adminIDs = ['443150640823271436 '];
if (isDevMode) {
    adminIDs.push('799524729173442620 ');
}

const DATA_FILE = process.argv.includes('--test') ? 'src/tests/resources/testData.txt' : 'localData.txt';

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

export const config = Object.freeze({
    prefix: isDevMode ? '!' : '$',
    token: TOKEN,
    // IDs are followed by a space (testId: 799524729173442620)
    adminIDs: Object.freeze(adminIDs),
    transactionLogChID: isDevMode ? '1081761590292009041' : '1062859204177698958',
    infoLogChID: isDevMode ? '1081761590292009041' : '1070859598627610746',
    errorLogChID: '1064628593772220488',
    processLog: '1091525626281857045',
    warnLogChID: '1095733636873076807',
    maxIOUCountPerReq: 999,
    // the name of the data file with the extension
    dataFile: DATA_FILE,
    isDevMode: isDevMode,
    hardwareTag: HARDWARE_TAG,
    sourceDirPath: 'dist/db-bank/src/main',
    NO_AMT_SELECTED_TXT: '*no amount selected*',
    TV_BID_CH: isDevMode ? '1091548846775095336' : '1177097674495905842',
});
