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

export const PREFIX = isDevMode ? ',' : '$';

// IDs followed by a space (test: 799524729173442620)
export const ADMIN_IDS = Object.freeze(['443150640823271436 ', '799524729173442620 ']);
