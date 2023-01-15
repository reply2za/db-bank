import {clientCommands} from "../utils/constants";

exports.run = (...args: any) => clientCommands.get('balance').run(...args);

