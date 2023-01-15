import {Message} from "discord.js";
import {BankUser} from "../finance/BankUser";
import {EmbedBuilderLocal} from "../utils/EmbedBuilderLocal";

exports.run = async (statement: string, message: Message, args: string[], prefix: string, bankUser: BankUser) => {
    await (new EmbedBuilderLocal())
        .setTitle('Help')
        .setDescription(
            'commands:\n' +
            '**balance** - view balance\n' +
            '**transfer** [name] - initiate transfer process'
        )
        .send(message.channel);
}

