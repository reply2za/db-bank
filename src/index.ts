'use strict';
import {Message} from "discord.js";
import {BankUser} from "./finance/BankUser";
import {bank} from "./finance/Bank";
import {localStorage} from "./Storage/LocalStorage";
import {BankVisualizer} from "./finance/BankVisualizer";
import {TransferManager} from "./finance/TransferManager";
import {EmbedBuilderLocal} from "./utils/EmbedBuilderLocal";
import {getUserResponse} from "./utils/utils";
import {ADMIN_IDS} from "./constants";

require('dotenv').config();
const token = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');
const {bot} = require('./constants');
// const isDev = process.argv.includes('--dev');

const PREFIX = '$';


function listenForMessages() {
    bot.on('messageCreate', async (message: Message) => {
        const msgPrefix = message.content.substring(0,PREFIX.length);
        if (msgPrefix !== PREFIX) return;
        let bankUser;
        bankUser = bank.getUser(message.author.id)
        if (!bankUser) {
            try {
                bank.addNewUser(new BankUser(message.author, message.author.username, 0));
                await localStorage.saveData(bank.serializeData());
            } catch (e) {
                console.log(e);
                message.channel.send('could not add user, please contact administrator');
            }
        }
        if (!bankUser) return;
        const args = message.content.replace(/\s+/g, ' ').split(' ');
        const statement = args[0].substring(1).toLowerCase();
        switch (statement) {
            case 'balance':
            case 'bank':
                await BankVisualizer.showBalance(message.channel, bankUser);
                break;
            case 'transfer':
                let recipientID;
                if (!args[1]) {
                    message.channel.send('Who you would like to send money to?')
                    const newMsg = (await getUserResponse(message.channel, message.author.id));
                    recipientID = newMsg?.mentions.users.first()?.id;
                    if (!recipientID) {
                        args[1] = newMsg?.content || '';
                        if (!args[1]) {
                            message.channel.send('must specify user to send to');
                            return;
                        }
                    }
                } else {
                    recipientID = message.mentions.users.first()?.id;
                }
                let recipientBankUser;
                if (recipientID) {
                    recipientBankUser = bank.getUser(recipientID);
                }
                else {
                    const transferUser = args.slice(1).join(' ');
                    const matchingUsers = bank.findUser(transferUser);
                    recipientBankUser = matchingUsers[0];
                }
                if (!recipientBankUser) {
                    return message.channel.send('could not find user');
                }
                if (recipientBankUser.userId === message.author.id && !ADMIN_IDS.includes(`${message.author.id} `)) {
                    return message.channel.send('you cannot send money to yourself');
                }
                await (new TransferManager(bankUser)).processMonetaryTransfer(message.channel, recipientBankUser);
                break;
            case 'help':
                await (new EmbedBuilderLocal())
                    .setTitle('Help')
                    .setDescription(
                        'commands:\n' +
                        '**balance** - view balance\n' +
                        '**transfer** [name] - initiate transfer process'
                    )
                    .send(message.channel);
                break;
        }
    });

}

async function loadData() {
    const data = localStorage.getData();
    if (data) {
        await bank.deserializeAndLoadData(data, bot.users);
    } else {
        console.log('no local data');
    }
}


(async () => {
    await bot.login(token);
    console.log('-logged in-')
    console.log('loading data...')
    await loadData();
    console.log('-data loaded-')
    listenForMessages();
})();
