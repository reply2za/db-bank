import Logger from './Logger';

const token = process.env.CLIENT_TOKEN?.replace(/\\n/gm, '\n');
const version = require('../../package.json').version;
import { bot, isDevMode } from './constants/constants';

if (!token) {
    throw new Error('missing params within .env');
}

class ProcessManager {
    #isActive;
    version;
    #isFixingConnection = false;
    #isLoggedIn = false;

    constructor() {
        // if in devMode then we want process to be on by default
        this.#isActive = isDevMode;
        this.version = version;
    }

    /**
     * Set the state of the process (active or inactive)
     * @param b True if active, false if inactive.
     */
    setState(b: boolean) {
        this.#isActive = b;
    }

    /**
     * Whether the process is active or inactive.
     */
    getState() {
        return this.#isActive;
    }

    isLoggedIn() {
        return this.#isLoggedIn;
    }

    /**
     * Attempts to login to discord.
     */
    async login(): Promise<boolean> {
        try {
            await bot.login(token);
            console.log('-logged in-');
            this.#isLoggedIn = true;
            return true;
        } catch (e) {
            console.log(e);
            console.log('[WARN] login failed, retrying...');
            await this.handleErrors(<Error>e);
        }
        return this.#isLoggedIn;
    }

    async handleErrors(error: Error, trace = '[ERROR]') {
        if (error.message.includes('getaddrinfo ENOTFOUND discord.com')) {
            this.#isLoggedIn = false;
            await this.fixConnection();
            return;
        }
        if (this.#isLoggedIn) {
            Logger.errorLog(error);
        } else {
            console.log(error);
        }
    }

    /**
     * Assuming that there was a connection error. Tries to reconnect.
     */
    async fixConnection(): Promise<boolean> {
        if (this.#isFixingConnection) return false;
        this.#isFixingConnection = true;
        const status = await this._fixConnection();
        this.#isFixingConnection = false;
        return status;
    }

    /**
     * Do not call this directly. Use fixConnection instead.
     */
    private async _fixConnection(): Promise<boolean> {
        let waitTimeMS = 10000;
        const retryText = (time: number) => `retrying in ${time / 1000} seconds...`;
        console.log(`no connection: ${retryText(waitTimeMS)}`);
        let retries = 1;
        const connect = async () => {
            console.log('connecting...');
            try {
                await bot.login(token);
                this.#isLoggedIn = true;
                console.log('connected.');
                return true;
            } catch (e) {
                // if the wait time was greater than 10 minutes, then exit
                if (waitTimeMS > 60_000 * 10) {
                    console.log(`failed to connect after ${retries} tries. exiting...`);
                    process.exit(1);
                }
                // after 3 tries, set the state to inactive
                if (retries > 2) this.setState(false);
                retries++;
                waitTimeMS *= 2;
                console.log(`connection failed.\n${retryText(waitTimeMS)}`);
            }
            return false;
        };
        while (true) {
            await new Promise((resolve) => setTimeout(resolve, waitTimeMS));
            if (await connect()) return true;
        }
    }
}

const processManager = new ProcessManager();
export { processManager };
