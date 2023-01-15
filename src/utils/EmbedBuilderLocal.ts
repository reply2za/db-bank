import {
    ColorResolvable,
    EmbedBuilder,
    EmbedFooterData,
    GuildTextBasedChannel,
    If,
    Message,
    TextBasedChannel,
} from 'discord.js';

/**
 * Local wrapper for EmbedBuilder.
 */
export class EmbedBuilderLocal {
    _embed;

    constructor() {
        this._embed = new EmbedBuilder();
    }

    setTitle(value: string) {
        this._embed.setTitle(value);
        return this;
    }

    setDescription(value: string) {
        this._embed.setDescription(value);
        return this;
    }

    setColor(value: ColorResolvable) {
        this._embed.setColor(value);
        return this;
    }

    setURL(value: string) {
        this._embed.setURL(value);
        return this;
    }

    setAuthor(name: string, url?: string) {
        this._embed.setAuthor({ name: name, iconURL: url });
        return this;
    }

    setFooter(value: string | EmbedFooterData) {
        if (typeof value === 'string') {
            this._embed.setFooter({ text: value });
        } else {
            this._embed.setFooter(value);
        }
        return this;
    }

    setImage(value: string) {
        this._embed.setImage(value);
        return this;
    }

    addFields(...value: Array<any>) {
        this._embed.addFields(...value);
        return this;
    }

    setFields(...value: Array<any>) {
        this._embed.setFields(...value);
        return this;
    }

    setThumbnail(value: string) {
        this._embed.setThumbnail(value);
        return this;
    }

    get data() {
        return this._embed.data;
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Returns an EmbedBuilder.
     * @return {import('discord.js').EmbedBuilder} The EmbedBuilder.
     */
    build() {
        return this._embed;
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Sends the embed to the channel.
     * @param channel The text channel to send the embed to.
     * @return {Message} The new message.
     */
    async send(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>) {
        return channel.send({ embeds: [this.build()] });
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Sends the embed in place of an existing message.
     * @param message {import('discord.js').Message} The message to edit.
     * @param content {string?} The content to send with the message.
     * @return {import('discord.js').Message} The edited message.
     */
    async edit(message: Message, content = '') {
        return message.edit({ embeds: [this.build()], content });
    }
}

module.exports = { EmbedBuilderLocal };
