import fs from 'fs';
import { bot } from '../utils/constants/constants';

class EventHandler {
    loadAllEvents() {
        const files = fs.readdirSync('./dist/src/events').filter((file) => file.endsWith('.js'));
        for (const file of files) {
            const eventName = file.split('.')[0];
            const event = require(`../events/${file}`);
            bot.on(eventName, event);
        }
        console.log('-loaded events-');
    }
}

const eventHandler = new EventHandler();
export { eventHandler };
