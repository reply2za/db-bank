import { GuildTextBasedChannel, If, Message, TextBasedChannel } from 'discord.js';
import { IOUTicket } from '../IOUTicket';
import { bot } from '../../utils/constants/constants';
import EmbedBuilderLocal from '../../utils/EmbedBuilderLocal';
import images from '../../utils/constants/images';
import { BankUserCopy } from '../BankUser/BankUserCopy';
import { convertToCurrency } from '../../utils/numberUtils';
import { processManager } from '../../utils/ProcessManager';

export default {
    async showBalance(
        channel: If<boolean, GuildTextBasedChannel, TextBasedChannel>,
        user: Readonly<BankUserCopy>,
        ious: IOUTicket[]
    ): Promise<Message> {
        const date = new Date();
        let balance = user.getBalance();
        // april fools joke, randomizes balance visual
        if ((date.getMonth() === 3 && date.getDate() === 1) || (date.getMonth() === 2 && date.getDate() > 30)) {
            const operator = Math.random() < 0.55 ? '+' : '-';
            const amount = Math.floor(Math.random() * 320_000);
            balance = operator === '+' ? balance + amount : balance - amount;
        }
        let iouDescription = '';
        const iouMap = new Map<string, number>();
        for (const iou of ious) {
            iouMap.set(iou.sender.id, (iouMap.get(iou.sender.id) || 0) + iou.quantity);
        }
        for (const [key, value] of iouMap) {
            const sender = await bot.users.fetch(key);
            iouDescription += `${sender.username}: ${value}\n`;
        }
        return new EmbedBuilderLocal()
            .setTitle(`${user.getUsername()}'s Bank`)
            .setColor('Green')
            .setDescription(
                `\`${convertToCurrency(balance)}\`\n${
                    iouDescription.length ? `\n- **Received IOUs** -\n${iouDescription}` : ''
                }`
            )
            .setFooter(`transfer cash | transfer IOUs${iouDescription.length ? ' | view IOUs' : ''}`)
            .setThumbnail(images.BANK_IMG)
            .send(channel);
    },
    getCoreTransferEmbed(): EmbedBuilderLocal {
        return new EmbedBuilderLocal().setColor('Purple').setThumbnail(images.TRANSFER_IMG);
    },
    getConfirmationEmbed(actionName = ''): EmbedBuilderLocal {
        if (actionName) actionName = ` ${actionName}`;
        return new EmbedBuilderLocal().setDescription(`confirm${actionName}? Type 'yes' or 'no'`).setColor('Yellow');
    },
    getErrorEmbed(description: string): EmbedBuilderLocal {
        return new EmbedBuilderLocal().setDescription(description).setColor('Red');
    },
};
