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
var __classPrivateFieldSet =
    (this && this.__classPrivateFieldSet) ||
    function (receiver, state, value, kind, f) {
        if (kind === 'm') throw new TypeError('Private method is not writable');
        if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a setter');
        if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError('Cannot write private member to an object whose class did not declare it');
        return kind === 'a' ? f.call(receiver, value) : f ? (f.value = value) : state.set(receiver, value), value;
    };
var __classPrivateFieldGet =
    (this && this.__classPrivateFieldGet) ||
    function (receiver, state, kind, f) {
        if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a getter');
        if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
            throw new TypeError('Cannot read private member from an object whose class did not declare it');
        return kind === 'm' ? f : kind === 'a' ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
var _a;
var _ProcessManager_isActive, _ProcessManager_isFixingConnection, _ProcessManager_isLoggedIn;
Object.defineProperty(exports, '__esModule', { value: true });
exports.processManager = void 0;
var Logger_1 = require('./Logger');
var constants_1 = require('./constants/constants');
var token = (_a = process.env.CLIENT_TOKEN) === null || _a === void 0 ? void 0 : _a.replace(/\\n/gm, '\n');
var version = require('../../../package.json').version;
if (!token) {
    throw new Error('missing params within .env');
}
var ProcessManager = /** @class */ (function () {
    function ProcessManager() {
        _ProcessManager_isActive.set(this, void 0);
        _ProcessManager_isFixingConnection.set(this, false);
        _ProcessManager_isLoggedIn.set(this, false);
        // if in devMode then we want process to be on by default
        __classPrivateFieldSet(this, _ProcessManager_isActive, constants_1.isDevMode, 'f');
        this.version = version;
    }
    ProcessManager.prototype.getLastProcessName = function () {
        return __awaiter(this, void 0, void 0, function () {
            var channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, constants_1.bot.channels.fetch('1065729072287715329')];
                    case 1:
                        channel = _a.sent();
                        return [
                            2 /*return*/,
                            channel === null || channel === void 0
                                ? void 0
                                : channel.messages.fetch('1090453246314815582'),
                        ];
                }
            });
        });
    };
    /**
     * Set the state of the process (active or inactive)
     * @param b True if active, false if inactive.
     */
    ProcessManager.prototype.setActive = function (b) {
        __classPrivateFieldSet(this, _ProcessManager_isActive, b, 'f');
        this.getLastProcessName().then(function (msg) {
            if (!constants_1.isDevMode && msg && msg.content !== constants_1.HARDWARE_TAG) {
                Logger_1.default.infoLog(
                    '[WARNING] process name changed from '.concat(msg.content, ' to ').concat(constants_1.HARDWARE_TAG)
                );
                msg.edit(constants_1.HARDWARE_TAG);
            }
        });
    };
    /**
     * Whether the process is active or inactive.
     */
    ProcessManager.prototype.isActive = function () {
        return __classPrivateFieldGet(this, _ProcessManager_isActive, 'f');
    };
    ProcessManager.prototype.isLoggedIn = function () {
        return __classPrivateFieldGet(this, _ProcessManager_isLoggedIn, 'f');
    };
    /**
     * Attempts to login to discord.
     */
    ProcessManager.prototype.login = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, constants_1.bot.login(token)];
                    case 1:
                        _a.sent();
                        console.log('-logged in-');
                        __classPrivateFieldSet(this, _ProcessManager_isLoggedIn, true, 'f');
                        return [2 /*return*/, true];
                    case 2:
                        e_1 = _a.sent();
                        console.log(e_1);
                        console.log('[WARN] login failed, retrying...');
                        return [4 /*yield*/, this.handleErrors(e_1)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        return [2 /*return*/, __classPrivateFieldGet(this, _ProcessManager_isLoggedIn, 'f')];
                }
            });
        });
    };
    ProcessManager.prototype.handleErrors = function (error, header) {
        if (header === void 0) {
            header = '[ERROR]';
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!error.message.includes('getaddrinfo ENOTFOUND discord.com')) return [3 /*break*/, 2];
                        __classPrivateFieldSet(this, _ProcessManager_isLoggedIn, false, 'f');
                        return [4 /*yield*/, this.fixConnection()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        if (__classPrivateFieldGet(this, _ProcessManager_isLoggedIn, 'f')) {
                            Logger_1.default.errorLog(error, header);
                        } else {
                            console.log(error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assuming that there was a connection error. Tries to reconnect.
     */
    ProcessManager.prototype.fixConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var status;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (__classPrivateFieldGet(this, _ProcessManager_isFixingConnection, 'f'))
                            return [2 /*return*/, false];
                        __classPrivateFieldSet(this, _ProcessManager_isFixingConnection, true, 'f');
                        return [4 /*yield*/, this._fixConnection()];
                    case 1:
                        status = _a.sent();
                        __classPrivateFieldSet(this, _ProcessManager_isFixingConnection, false, 'f');
                        return [2 /*return*/, status];
                }
            });
        });
    };
    /**
     * Do not call this directly. Use fixConnection instead.
     */
    ProcessManager.prototype._fixConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var waitTimeMS, retryText, retries, connect;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        waitTimeMS = 10000;
                        retryText = function (time) {
                            return 'retrying in '.concat(time / 1000, ' seconds...');
                        };
                        console.log('no connection: '.concat(retryText(waitTimeMS)));
                        retries = 1;
                        connect = function () {
                            return __awaiter(_this, void 0, void 0, function () {
                                var e_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            console.log('connecting...');
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, constants_1.bot.login(token)];
                                        case 2:
                                            _a.sent();
                                            __classPrivateFieldSet(this, _ProcessManager_isLoggedIn, true, 'f');
                                            console.log('connected.');
                                            return [2 /*return*/, true];
                                        case 3:
                                            e_2 = _a.sent();
                                            // if the wait time was greater than 10 minutes, then exit
                                            if (waitTimeMS > 60000 * 10) {
                                                console.log(
                                                    'failed to connect after '.concat(retries, ' tries. exiting...')
                                                );
                                                process.exit(1);
                                            }
                                            // after 3 tries, set the state to inactive
                                            if (retries > 2) this.setActive(false);
                                            retries++;
                                            waitTimeMS *= 2;
                                            console.log('connection failed.\n'.concat(retryText(waitTimeMS)));
                                            return [3 /*break*/, 4];
                                        case 4:
                                            return [2 /*return*/, false];
                                    }
                                });
                            });
                        };
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 4];
                        return [
                            4 /*yield*/,
                            new Promise(function (resolve) {
                                return setTimeout(resolve, waitTimeMS);
                            }),
                        ];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, connect()];
                    case 3:
                        if (_a.sent()) return [2 /*return*/, true];
                        return [3 /*break*/, 1];
                    case 4:
                        return [2 /*return*/];
                }
            });
        });
    };
    return ProcessManager;
})();
(_ProcessManager_isActive = new WeakMap()),
    (_ProcessManager_isFixingConnection = new WeakMap()),
    (_ProcessManager_isLoggedIn = new WeakMap());
var processManager = new ProcessManager();
exports.processManager = processManager;
