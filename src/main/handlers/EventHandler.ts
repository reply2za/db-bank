import fs from 'fs';
import { config } from '../utils/constants/constants';
import { EventHandler } from '@hoursofza/djs-common';

class EventHandlerLocal extends EventHandler {
    constructor() {
        super(`./${config.sourceDirPath}/events`, '../events');
    }
    protected requireModule(): NodeJS.Require {
        return require;
    }

    protected fsModule(): typeof import('fs') {
        return fs;
    }
}

const eventHandler = new EventHandlerLocal();
export { eventHandler };
