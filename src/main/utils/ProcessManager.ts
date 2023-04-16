import { bot, config } from './constants/constants';
import { Message, MessageReaction, ReactionCollector, TextChannel } from 'discord.js';
import reactions from './constants/reactions';
import { attachReactionToMessage } from './utils';
import { execSync } from 'child_process';
import logger from './Logger';

const version = require('../../../package.json').version;

class ProcessManager {
    #isActive;
    version;
    #isFixingConnection = false;
    #isLoggedIn = false;
    #processLogInterval: NodeJS.Timeout | undefined;
    private static MINUTES = 60;
    // the time to update the process log in minutes
    private static UPDATE_LOG_INTERVAL = 1000 * 60 * ProcessManager.MINUTES;

    constructor() {
        // if in devMode then we want process to be on by default
        this.#isActive = config.isDevMode;
        this.version = version;
    }

    async getLastProcessName(): Promise<Message | undefined> {
        const channel = await bot.channels.fetch('1065729072287715329');
        return (<TextChannel>channel)?.messages.fetch('1090453246314815582');
    }

    /**
     * Set the state of the process (active or inactive)
     * @param b True if active, false if inactive.
     */
    setActive(b: boolean) {
        this.#isActive = b;
        if (b && !config.isDevMode) {
            this.getLastProcessName().then((msg) => {
                // log error with reactions
                if (msg && msg.content !== config.hardwareTag) {
                    logger
                        .errorLog(`new active process PREV: (${msg.content}) NOW: (${config.hardwareTag})`, '[WARNING]')
                        .then((logMsg) => this.updateActiveProcessName(msg, logMsg));
                }
                this.updateProcessLog();
            });
        }
    }

    /**
     * Whether the process is active or inactive.
     */
    isActive() {
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
            await bot.login(config.token);
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

    async handleErrors(error: Error, additionalInfo = '[ERROR]') {
        if (config.isDevMode) {
            console.log(error);
            return;
        }
        // connectivity error
        if (error.message.includes('getaddrinfo ENOTFOUND discord.com')) {
            this.#isLoggedIn = false;
            await this.fixConnection();
            return;
        }
        // package related issues
        if (error.message.includes('Cannot find module')) {
            execSync('git stash && git pull && npm run pm2');
            console.log(error);
        } else {
            if (this.#isLoggedIn) {
                logger.errorLog(error, additionalInfo).catch((e) => console.log(e));
            } else {
                console.log(error);
            }
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
                await bot.login(config.token);
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
                if (retries > 2) this.setActive(false);
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

    /**
     * Updates the hardware tag message with the current process name. Expects a response from the user to confirm or deny the change.
     * No response will be the same as confirming the change.
     * @param hardwareTagMsg The message containing the latest active hardware tag name.
     * @param statusMsg The message that informs the admins that the active process is different.
     * @private
     */
    private async updateActiveProcessName(hardwareTagMsg: Message, statusMsg?: Message) {
        if (!statusMsg) {
            await hardwareTagMsg.edit(config.hardwareTag);
        } else {
            let collector: ReactionCollector | undefined;
            let responseReceived = false;
            const processNameChangedTxt = `process name changed: ${hardwareTagMsg.content} => ${config.hardwareTag}`;
            const callback = (reaction: MessageReaction) => {
                if (reaction.emoji.name === reactions.CHECK) {
                    hardwareTagMsg.edit(config.hardwareTag);
                    statusMsg.channel.send(processNameChangedTxt);
                    responseReceived = true;
                } else if (reaction.emoji.name === reactions.X) {
                    this.setActive(false);
                    statusMsg.channel.send(`process name will remain as ${hardwareTagMsg.content}`);
                    responseReceived = true;
                }
                if (collector) collector.stop();
            };
            const endCallback = async () => {
                statusMsg.reactions.removeAll().catch((e) => logger.debugLog(e));
                if (!responseReceived) {
                    await hardwareTagMsg.edit(config.hardwareTag);
                    statusMsg.channel.send(processNameChangedTxt);
                }
            };
            collector = await attachReactionToMessage(
                statusMsg,
                config.adminIDs.map((id) => id.trim()),
                [reactions.CHECK, reactions.X],
                callback,
                endCallback,
                undefined,
                60000
            );
        }
    }

    /**
     * If active then update the process log, otherwise fetch a channel to check connection status.
     */
    updateProcessLog() {
        const checkConnection = () => {
            if (this.isLoggedIn()) {
                if (this.isActive()) {
                    bot.channels.fetch(config.processLog).then(async (msg) => {
                        await (<TextChannel>msg).send(
                            `~db-bank[v${this.version}][${config.hardwareTag}][${process.pid}](${config.prefix})`
                        );
                    });
                } else {
                    // fetch to check connection
                    bot.channels.fetch(config.processLog, { force: true });
                }
            }
        };
        checkConnection();
        if (this.#processLogInterval) clearInterval(this.#processLogInterval);
        this.#processLogInterval = setInterval(() => {
            checkConnection();
        }, ProcessManager.UPDATE_LOG_INTERVAL);
    }
}

const processManager = new ProcessManager();
export { processManager };
