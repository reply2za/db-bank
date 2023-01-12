import {EmbedBuilderLocal} from "../utils/EmbedBuilderLocal";
import {GuildTextBasedChannel, If, Message, TextBasedChannel} from "discord.js";
import {BankUser} from "./BankUser";
import {BANK_IMG} from "../constants";

class BankVisualizer {
    static showBalance(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, user: Readonly<BankUser>): Promise<Message> {
        return (new EmbedBuilderLocal)
            .setTitle(`${user.name}\'s Bank`)
            .setColor('Green')
            .setDescription(`$${user.getBalance()}`)
            .setThumbnail(BANK_IMG)
            .send(channel);
    }

    static getTransferEmbed(channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>, sender: Readonly<BankUser>, receiver: Readonly<BankUser> , amount = 0): EmbedBuilderLocal {
        return (new EmbedBuilderLocal)
            .setTitle(`Transfer to ${receiver.name}`)
            .setFooter(`your balance: $${sender.balance}`)
            .setColor('Greyple')
            .setDescription(amount ? `sending $${amount}` : '*no amount selected*');
    }
}

export {BankVisualizer};
