import { Client, GatewayIntentBits, Partials } from 'discord.js';
// the db bot instance
export const bot: Client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
});

// IDs followed by a space
export const ADMIN_IDS = Object.freeze(['443150640823271436 ']);

export const BANK_IMG = 'https://static.wikia.nocookie.net/spongebob/images/9/92/Goodbye%2C_Krabby_Patty_151.png/revision/latest?cb=20170310020233';

export enum MoneyImage {
    TINY = "https://static.wikia.nocookie.net/spongebob/images/8/89/Wet_Painters_185.png/revision/latest?cb=20191215190719",
    SMALL= "https://static.wikia.nocookie.net/spongebob/images/0/03/Wet_Painters_085.jpg/revision/latest?cb=20150818012516",
    MEDIUM= "https://static.wikia.nocookie.net/spongebob/images/0/07/Free_Samples_180.png/revision/latest/scale-to-width-down/1200?cb=20220618190533",
    LARGE="https://media.tenor.com/OaYYWO9efBIAAAAC/rich-money.gif"
}
