'use strict';
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: [],
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === 'function' &&
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError('Generator is already executing.');
            while ((g && ((g = 0), op[0] && (_ = 0)), _))
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y['return']
                                    : op[0]
                                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
var __classPrivateFieldGet =
    (this && this.__classPrivateFieldGet) ||
    function (receiver, state, kind, f) {
        if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a getter');
        if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError('Cannot read private member from an object whose class did not declare it');
        return kind === 'm' ? f : kind === 'a' ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
var _CommandHandler_instances, _CommandHandler_parseRootDirectory, _CommandHandler_loadSpecificCommands;
Object.defineProperty(exports, '__esModule', { value: true });
exports.commandHandler = void 0;
var utils_1 = require('../utils/utils');
var fs_1 = require('fs');
var discord_js_1 = require('discord.js');
var ProcessManager_1 = require('../utils/ProcessManager');
var path_1 = require('path');
// list of commands that should not be process-specific
var MULTI_PROCESS_CMDS = ['boot', 'update'];
// the output directory name where source files are generated
var SOURCE_DIR_NAME = 'dist';
var CommandHandler = /** @class */ (function () {
    function CommandHandler() {
        _CommandHandler_instances.add(this);
        this.clientCommands = new discord_js_1.Collection();
        this.adminCommands = new discord_js_1.Collection();
    }
    CommandHandler.prototype.loadAllCommands = function () {
        __classPrivateFieldGet(this, _CommandHandler_instances, 'm', _CommandHandler_loadSpecificCommands).call(
            this,
            'commands/client',
            this.clientCommands
        );
        __classPrivateFieldGet(this, _CommandHandler_instances, 'm', _CommandHandler_loadSpecificCommands).call(
            this,
            'commands/admin',
            this.adminCommands
        );
        console.log('-loaded commands-');
    };
    /**
     * Executes an event.
     * @param event
     */
    CommandHandler.prototype.execute = function (event) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        return [
                            4 /*yield*/,
                            (_a = this.getCommand(event.statement, event.message.author.id)) === null || _a === void 0
                                ? void 0
                                : _a.run(event),
                        ];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the command method for the given command name.
     * @param statement The command name.
     * @param authorId The id of the author who sent the command.
     */
    CommandHandler.prototype.getCommand = function (statement, authorId) {
        if (!ProcessManager_1.processManager.isActive() && !MULTI_PROCESS_CMDS.includes(statement)) return;
        if ((0, utils_1.isAdmin)(authorId)) {
            return this.adminCommands.get(statement) || this.clientCommands.get(statement);
        } else {
            return this.clientCommands.get(statement);
        }
    };
    return CommandHandler;
})();
(_CommandHandler_instances = new WeakSet()),
    (_CommandHandler_parseRootDirectory = function _CommandHandler_parseRootDirectory(dirPath) {
        var subDirs = [];
        var jsFiles = fs_1.default.readdirSync(dirPath).filter(function (fName) {
            var extName = path_1.default.extname(fName);
            if (extName) {
                return extName === '.js';
            } else {
                subDirs.push(fName);
            }
            return false;
        });
        return {
            // the root js files in the directory
            jsFiles: jsFiles,
            // list of subdirectories
            subDirs: subDirs,
        };
    }),
    (_CommandHandler_loadSpecificCommands = function _CommandHandler_loadSpecificCommands(innerPath, commandsMap) {
        var dirPath = './'.concat(SOURCE_DIR_NAME, '/').concat(innerPath);
        // maps a filename to the correct relative path
        var cmdFileReference = new Map();
        var rootFiles = __classPrivateFieldGet(
            this,
            _CommandHandler_instances,
            'm',
            _CommandHandler_parseRootDirectory
        ).call(this, dirPath);
        rootFiles.jsFiles.forEach(function (fileName) {
            return cmdFileReference.set(fileName, '../'.concat(innerPath, '/').concat(fileName));
        });
        var _loop_1 = function (subDirName) {
            var subDirPath = ''.concat(dirPath, '/').concat(subDirName);
            var subRootFiles = __classPrivateFieldGet(
                this_1,
                _CommandHandler_instances,
                'm',
                _CommandHandler_parseRootDirectory
            ).call(this_1, subDirPath);
            if (subRootFiles.subDirs.length > 0) throw new Error('unsupported file structure');
            subRootFiles.jsFiles.forEach(function (fileName) {
                return cmdFileReference.set(
                    fileName,
                    '../'.concat(innerPath, '/').concat(subDirName, '/').concat(subDirName, '.js')
                );
            });
        };
        var this_1 = this;
        for (var _i = 0, _a = rootFiles.subDirs; _i < _a.length; _i++) {
            var subDirName = _a[_i];
            _loop_1(subDirName);
        }
        cmdFileReference.forEach(function (relativePath, fileName) {
            var commandName = fileName.split('.')[0];
            var command = require(relativePath);
            commandsMap.set(commandName, command);
        });
    });
var commandHandler = new CommandHandler();
exports.commandHandler = commandHandler;
