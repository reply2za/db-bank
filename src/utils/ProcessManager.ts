import { isDevMode } from './constants';

class ProcessManager {
    #isActive;

    constructor() {
        // if in devMode then we want process to be on by default
        this.#isActive = isDevMode;
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
}

const processManager = new ProcessManager();
export { processManager };
