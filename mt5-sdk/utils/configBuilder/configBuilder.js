"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var axios_1 = require("axios");
var dotenv = require('dotenv');
dotenv.config();
var apiBaseUrl = process.env.FAST_API;
function getTotalOpenAmount(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/get_total_open_amount/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data.total_open_amount];
                case 3:
                    error_1 = _b.sent();
                    console.error('Error retrieving total open amount:', error_1);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for getTotalOpenAmount');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function retrieveLatestTick(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/retrieve_latest_tick/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_2 = _b.sent();
                    console.error('Error retrieving latest tick:', error_2);
                    return [2 /*return*/, { bid: 0, ask: 0 }];
                case 4:
                    console.error('Unsupported broker for retrieveLatestTick');
                    return [2 /*return*/, { bid: 0, ask: 0 }];
            }
        });
    });
}
function retrieveAllSymbols(broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/retrieve_all_symbols"))];
                case 2: return [2 /*return*/, (_b.sent()).data.symbols];
                case 3:
                    error_3 = _b.sent();
                    console.error('Error retrieving all symbols:', error_3);
                    return [2 /*return*/, []];
                case 4:
                    console.error('Unsupported broker for retrieveAllSymbols');
                    return [2 /*return*/, []];
            }
        });
    });
}
function manageSymbolInventory(symbol, amount, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("".concat(apiBaseUrl, "/manage_symbol_inventory/").concat(symbol), { amount: amount })];
                case 2: return [2 /*return*/, (_b.sent()).status === 200];
                case 3:
                    error_4 = _b.sent();
                    console.error('Error managing symbol inventory:', error_4);
                    return [2 /*return*/, false];
                case 4:
                    console.error('Unsupported broker for manageSymbolInventory');
                    return [2 /*return*/, false];
            }
        });
    });
}
function resetAccount(broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.post("".concat(apiBaseUrl, "/reset_account"))];
                case 2: return [2 /*return*/, (_b.sent()).status === 200];
                case 3:
                    error_5 = _b.sent();
                    console.error('Error resetting account:', error_5);
                    return [2 /*return*/, false];
                case 4:
                    console.error('Unsupported broker for resetAccount');
                    return [2 /*return*/, false];
            }
        });
    });
}
function retrieveMaxNotional(broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/retrieve_max_notional"))];
                case 2: return [2 /*return*/, (_b.sent()).data.max_notional];
                case 3:
                    error_6 = _b.sent();
                    console.error('Error retrieving max notional:', error_6);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for retrieveMaxNotional');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function minAmountSymbol(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/min_amount_symbol/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data.min_amount];
                case 3:
                    error_7 = _b.sent();
                    console.error('Error retrieving minimum amount:', error_7);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for minAmountSymbol');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function symbolInfo(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_8;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/symbol_info/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_8 = _b.sent();
                    console.error('Error retrieving symbol info:', error_8);
                    return [2 /*return*/, null];
                case 4:
                    console.error('Unsupported broker for symbolInfo');
                    return [2 /*return*/, null];
            }
        });
    });
}
function precisionInfo(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_9;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/precision_info/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_9 = _b.sent();
                    console.error('Error retrieving precision info:', error_9);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for precisionInfo');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function fundingLongInfo(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_10;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/funding_long_info/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_10 = _b.sent();
                    console.error('Error retrieving funding long info:', error_10);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for fundingLongInfo');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function fundingShortInfo(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_11;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/funding_short_info/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_11 = _b.sent();
                    console.error('Error retrieving funding short info:', error_11);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for fundingShortInfo');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function minAmountAssetInfo(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_12;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/min_ammount_asset_info/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_12 = _b.sent();
                    console.error('Error retrieving minimum amount asset info:', error_12);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for minAmountAssetInfo');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function maxAmountAssetInfo(symbol, broker) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_13;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = broker;
                    switch (_a) {
                        case 'mt5.ICMarkets': return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 4];
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1.default.get("".concat(apiBaseUrl, "/max_ammount_asset_info/").concat(symbol))];
                case 2: return [2 /*return*/, (_b.sent()).data];
                case 3:
                    error_13 = _b.sent();
                    console.error('Error retrieving maximum amount asset info:', error_13);
                    return [2 /*return*/, 0];
                case 4:
                    console.error('Unsupported broker for maxAmountAssetInfo');
                    return [2 /*return*/, 0];
            }
        });
    });
}
function processSymphonyJSON(symphonyJSONPath) {
    var rawData = fs.readFileSync(symphonyJSONPath, 'utf-8');
    return JSON.parse(rawData);
}
function backupSymphonyJSON(symphonyJSONPath) {
    var backupFolder = 'backups';
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
    }
    var backupFiles = fs.readdirSync(backupFolder);
    var maxBackupNumber = 0;
    backupFiles.forEach(function (file) {
        var match = file.match(/symphony_backup(\d+)\.json/);
        if (match) {
            var backupNumber_1 = parseInt(match[1]);
            if (backupNumber_1 > maxBackupNumber) {
                maxBackupNumber = backupNumber_1;
            }
        }
    });
    var backupNumber = maxBackupNumber + 1;
    var backupPath = "".concat(backupFolder, "/symphony_backup").concat(backupNumber, ".json");
    fs.copyFileSync(symphonyJSONPath, backupPath);
    var backupInfo = { path: backupPath, timestamp: new Date().toISOString() };
    var backupInfoString = JSON.stringify(backupInfo, null, 2);
    fs.appendFileSync('backdup.json', backupInfoString + '\n');
}
function updateSymphonyJSON(symphonyJSONPath, mt5SymbolList) {
    var symphonyJSONData = JSON.stringify(mt5SymbolList, null, 2);
    fs.writeFileSync(symphonyJSONPath, symphonyJSONData);
}
var symphonyJSONPath = 'symphony.json';
var mt5SymbolList = processSymphonyJSON(symphonyJSONPath);
function symbolStartsWithForex(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var response, symbolInfo_1, lastElement, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get(apiBaseUrl + '/symbol_info/' + symbol)];
                case 1:
                    response = _a.sent();
                    console.log(apiBaseUrl);
                    symbolInfo_1 = response.data;
                    lastElement = symbolInfo_1[symbolInfo_1.length - 1];
                    return [2 /*return*/, typeof lastElement === 'string' && lastElement.startsWith('Forex')];
                case 2:
                    error_14 = _a.sent();
                    console.error('Error retrieving symbol info:', error_14);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createFieldInAsset(mt5SymbolList, broker, proxyTicker, key, fieldName, fieldValue) {
    var _a, _b;
    var _c;
    var asset = mt5SymbolList.assets.find(function (a) { return a.broker === broker && a.proxyTicker === proxyTicker; });
    if (asset) {
        var notionalRow = (_c = asset.notional) === null || _c === void 0 ? void 0 : _c.find(function (r) { return r.side === key.side && r.leverage === key.leverage; });
        if (!notionalRow) {
            var newRow = __assign(__assign({}, key), (_a = {}, _a[fieldName] = fieldValue, _a));
            asset.notional = asset.notional || [];
            asset.notional.push(newRow);
        }
        else {
            console.warn("Combination of side: ".concat(key.side, " and leverage: ").concat(key.leverage, " already exists for broker: ").concat(broker, ", proxyTicker: ").concat(proxyTicker));
        }
    }
    else {
        var newAsset = {
            mt5Ticker: '',
            proxyTicker: proxyTicker,
            broker: broker,
            notional: [
                __assign(__assign({}, key), (_b = {}, _b[fieldName] = fieldValue, _b)),
            ],
        };
        mt5SymbolList.assets.push(newAsset);
    }
}
function addFieldToAsset(mt5SymbolList, broker, proxyTicker, key, fieldName, fieldValue) {
    var _a;
    var _b;
    var asset = mt5SymbolList.assets.find(function (a) { return a.broker === broker && a.proxyTicker === proxyTicker; });
    if (asset) {
        var notionalRow = (_b = asset.notional) === null || _b === void 0 ? void 0 : _b.find(function (r) { return r.side === key.side && r.leverage === key.leverage; });
        if (notionalRow) {
            if (fieldValue !== undefined) {
                notionalRow[fieldName] = fieldValue;
            }
            else {
                delete notionalRow[fieldName];
            }
        }
        else {
            var newRow = __assign(__assign({}, key), (_a = {}, _a[fieldName] = fieldValue, _a));
            asset.notional = asset.notional || [];
            asset.notional.push(newRow);
        }
    }
    else {
        console.warn("Asset not found for broker: ".concat(broker, ", proxyTicker: ").concat(proxyTicker));
    }
}
function getFieldFromAsset(mt5SymbolList, broker, proxyTicker, key, fieldName) {
    var _a;
    var asset = mt5SymbolList.assets.find(function (a) { return a.broker === broker && a.proxyTicker === proxyTicker; });
    if (asset) {
        var notionalRow = (_a = asset.notional) === null || _a === void 0 ? void 0 : _a.find(function (r) { return r.side === key.side && r.leverage === key.leverage; });
        if (notionalRow && notionalRow[fieldName] !== undefined) {
            return notionalRow[fieldName];
        }
    }
    return undefined;
}
function forEachAsset(mt5SymbolList, callback) {
    mt5SymbolList.assets.forEach(function (asset) {
        callback(asset, asset.broker, asset.proxyTicker);
    });
}
function forEachNotionalKey(asset, callback) {
    var _a;
    (_a = asset.notional) === null || _a === void 0 ? void 0 : _a.forEach(function (notionalRow) {
        var key = {
            side: notionalRow.side,
            leverage: notionalRow.leverage,
        };
        callback(key, notionalRow);
    });
}
function getHedgerForProxyTicker(mt5SymbolList, proxyTicker) {
    var asset = mt5SymbolList.assets.find(function (a) { return a.proxyTicker === proxyTicker; });
    return asset === null || asset === void 0 ? void 0 : asset.broker;
}
function processAssetByHedger(mt5SymbolList, proxyTicker, hedgerFunctions) {
    var hedger = getHedgerForProxyTicker(mt5SymbolList, proxyTicker);
    if (hedger && hedgerFunctions[hedger]) {
        var asset = mt5SymbolList.assets.find(function (a) { return a.proxyTicker === proxyTicker; });
        if (asset) {
            hedgerFunctions[hedger](asset);
        }
    }
}
function getMt5TickerForProxyTicker(mt5SymbolList, proxyTicker) {
    var asset = mt5SymbolList.assets.find(function (a) { return a.proxyTicker === proxyTicker; });
    return asset === null || asset === void 0 ? void 0 : asset.mt5Ticker;
}
function processAllAssetsExample(mt5SymbolList) {
    forEachAsset(mt5SymbolList, function (asset, broker, proxyTicker) {
        console.log("Processing Asset: broker=".concat(broker, ", proxyTicker=").concat(proxyTicker));
        forEachNotionalKey(asset, function (key, notionalRow) {
            console.log("  NotionalKey: side=".concat(key.side, ", leverage=").concat(key.leverage));
            // Process each notional row
            // ...
        });
    });
}
function processAllAssets(mt5SymbolList) {
    return __awaiter(this, void 0, void 0, function () {
        var sides, leverageValues, broker, assetsToProcess, _i, assetsToProcess_1, asset, rows, _a, sides_1, side, _b, leverageValues_1, leverage, funding, _c, isAPayingApr, expiryA, expiryB, row;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    sides = ['long', 'short'];
                    leverageValues = [1, 5, 10, 25, 50, 100, 250, 500];
                    broker = 'mt5.ICMarkets';
                    assetsToProcess = mt5SymbolList.assets;
                    _i = 0, assetsToProcess_1 = assetsToProcess;
                    _e.label = 1;
                case 1:
                    if (!(_i < assetsToProcess_1.length)) return [3 /*break*/, 16];
                    asset = assetsToProcess_1[_i];
                    if (!(asset.broker === broker)) return [3 /*break*/, 15];
                    console.log("Processing Asset: broker=".concat(broker, ", proxyTicker=").concat(asset.proxyTicker));
                    rows = [];
                    _a = 0, sides_1 = sides;
                    _e.label = 2;
                case 2:
                    if (!(_a < sides_1.length)) return [3 /*break*/, 13];
                    side = sides_1[_a];
                    _b = 0, leverageValues_1 = leverageValues;
                    _e.label = 3;
                case 3:
                    if (!(_b < leverageValues_1.length)) return [3 /*break*/, 12];
                    leverage = leverageValues_1[_b];
                    if (!(side == 'long')) return [3 /*break*/, 5];
                    return [4 /*yield*/, fundingLongInfo(asset.mt5Ticker, broker)];
                case 4:
                    _c = _e.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, fundingShortInfo(asset.mt5Ticker, broker)];
                case 6:
                    _c = _e.sent();
                    _e.label = 7;
                case 7:
                    funding = _c;
                    isAPayingApr = side == 'long' ? true : false;
                    expiryA = side == 'long' ? 60 : 1440 * 30 * 3;
                    expiryB = side == 'long' ? 1440 * 30 * 3 : 60;
                    _d = {
                        side: side,
                        leverage: leverage,
                        maxNotional: 100
                    };
                    return [4 /*yield*/, minAmountAssetInfo(asset.mt5Ticker, broker)];
                case 8:
                    _d.minAmount = _e.sent();
                    return [4 /*yield*/, maxAmountAssetInfo(asset.mt5Ticker, broker)];
                case 9:
                    _d.maxAmount = _e.sent();
                    return [4 /*yield*/, precisionInfo(asset.mt5Ticker, broker)];
                case 10:
                    row = (_d.precision = _e.sent(),
                        _d.maxLeverageDeltaGlobalNotional = 10000000,
                        _d.maxLeverageLongGlobalNotional = 2000000,
                        _d.maxLeverageShortGlobalNotional = 1500000,
                        _d.imA = 0.75 / leverage,
                        _d.imB = 0.75 / leverage,
                        _d.dfA = 0.25 / leverage,
                        _d.dfB = 0.25 / leverage,
                        _d.ir = 0.01,
                        _d.expiryA = expiryA,
                        _d.expiryB = expiryB,
                        _d.timeLockA = 1440 * 30 * 3,
                        _d.timeLockB = 1440 * 30 * 3,
                        _d.maxConfidence = 1,
                        _d.maxDelay = 60000,
                        _d.forceCloseType = 1,
                        _d.kycType = 1,
                        _d.cType = 1,
                        _d.kycAddress = '0x0000000000000000000000000000000000000000',
                        _d.brokerFee = 0.0003,
                        _d.funding = funding,
                        _d.isAPayingApr = isAPayingApr,
                        _d);
                    rows.push(row);
                    _e.label = 11;
                case 11:
                    _b++;
                    return [3 /*break*/, 3];
                case 12:
                    _a++;
                    return [3 /*break*/, 2];
                case 13:
                    asset.notional = rows;
                    // Rate limit: Wait for 1 second before processing the next asset
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 14:
                    // Rate limit: Wait for 1 second before processing the next asset
                    _e.sent();
                    _e.label = 15;
                case 15:
                    _i++;
                    return [3 /*break*/, 1];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    backupSymphonyJSON(symphonyJSONPath);
                    ////////////////////////////////////// 
                    ////////////////////////////////////// 
                    // Code here
                    return [4 /*yield*/, processAllAssets(mt5SymbolList)];
                case 1:
                    ////////////////////////////////////// 
                    ////////////////////////////////////// 
                    // Code here
                    _a.sent();
                    ////////////////////////////////////// 
                    ////////////////////////////////////// 
                    updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);
                    return [2 /*return*/];
            }
        });
    });
}
main();
/*

processAllAssets(mt5SymbolList);
*/
/*

const key: NotionalKey = {
    side: 'LONG',
    leverage: 10,
};
const fieldName: keyof Row = 'maxConfidence';
const fieldValue = 0.8;

addFieldToAsset(mt5SymbolList, broker, proxyTicker, key, fieldName, fieldValue);
updateSymphonyJSON(symphonyJSONPath, mt5SymbolList);

const retrievedValue = getFieldFromAsset(mt5SymbolList, broker, proxyTicker, key, fieldName);
console.log(`Retrieved value: ${retrievedValue}`);

*/
// make a function that takes a proxyTicker and get it's hedger
// make a metaFunction that redirect subFunciton based on hedger name.
// make a symbol that gets mt5Ticker for it's proxyTicker
// configBuilder.getPionerSymbolFromMt5Symbol(symbolMt5)
// configBuilder.testMt5SymbolOnProxy(symbolMt5)
// configBuilder.addHedger(hedger)
// configBuilder.removeHedger(hedger)
// configBuilder.getHedger(hedger)
// configBuilder.addHedgerToAsset(hedger, asset)
// configBuilder.removeHedgerToAsset(hedger, asset)
