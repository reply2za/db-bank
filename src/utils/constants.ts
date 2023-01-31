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

// IDs followed by a space
export const ADMIN_IDS = Object.freeze(['443150640823271436 ']);

export const BANK_IMG =
    'https://static.wikia.nocookie.net/spongebob/images/9/92/Goodbye%2C_Krabby_Patty_151.png/revision/latest?cb=20170310020233';
export const TRANSFER_IMG =
    'https://vignette.wikia.nocookie.net/spongebob/images/2/25/Mermaid_Man_and_Barnacle_Boy_III_092.png/revision/latest?cb=20191208224116';
export const TRANSFER_IOU_IMG = 'https://i.makeagif.com/media/2-27-2016/cuk9a4.gif';

export const REDEEM_IOU_IMG = 'https://thumbs.gfycat.com/UnlinedSoreDowitcher-size_restricted.gif';

export const REDEEMED_IOU_NOTIF_IMG =
    'https://static.wikia.nocookie.net/spongebob/images/8/89/Drifter.png/revision/latest?cb=20150728004136';

export enum MoneyImage {
    TINY = 'https://static.wikia.nocookie.net/spongebob/images/8/89/Wet_Painters_185.png/revision/latest?cb=20191215190719',
    SMALL = 'https://static.wikia.nocookie.net/spongebob/images/0/03/Wet_Painters_085.jpg/revision/latest?cb=20150818012516',
    MEDIUM = 'https://static.wikia.nocookie.net/spongebob/images/7/75/One_Coarse_Meal_078.png/revision/latest?cb=20191029022119',
    LARGE = 'https://i.kym-cdn.com/entries/icons/original/000/026/111/4917038d8bbd7fe362bed691690c7da4.jpg',
}
