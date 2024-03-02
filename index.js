"use strict";
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
var axios_1 = require("axios");
var makeApiCalls = require('./src/proxyCall');
var dotenv = require('dotenv');
dotenv.config();
var fastApiUrl = process.env.FAST_API;
//ConfigBuilder.ts
function symbolStartsWithForex(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var response, symbolInfo, lastElement, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get(fastApiUrl + '/symbol_info/' + symbol)];
                case 1:
                    response = _a.sent();
                    symbolInfo = response.data;
                    lastElement = symbolInfo[symbolInfo.length - 1];
                    return [2 /*return*/, typeof lastElement === 'string' && lastElement.startsWith('Forex')];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error retrieving symbol info:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function testProxySymbol(symbol) {
    return __awaiter(this, void 0, void 0, function () {
        var Precision, maxtimestampdiff, price, maxRetry, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Precision = 5;
                    maxtimestampdiff = 200000;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    price = void 0;
                    maxRetry = 3;
                    _a.label = 2;
                case 2:
                    if (!((!price || price.pairBid === undefined) && maxRetry > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, makeApiCalls(maxtimestampdiff, Precision, symbol, symbol)];
                case 3:
                    price = _a.sent();
                    maxRetry--;
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 2];
                case 5:
                    if (price.pairBid === undefined) {
                        console.log(symbol + ' is not available on the proxy');
                    }
                    return [2 /*return*/, price.pairBid === 1];
                case 6:
                    error_2 = _a.sent();
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function retrieveAllSymbols() {
    return __awaiter(this, void 0, void 0, function () {
        var response, symbols, stocks_1, forex, error_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get(fastApiUrl + '/retrieve_all_symbols')];
                case 1:
                    response = _a.sent();
                    symbols = response.data.symbols;
                    stocks_1 = [];
                    forex = [];
                    symbols.forEach(function (symbol) { return __awaiter(_this, void 0, void 0, function () {
                        var name_1, isProxy, name_2, name_3, name_4, name_5, name_6, name_7, isForex, name_8;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!symbol.endsWith('.NAS')) return [3 /*break*/, 2];
                                    name_1 = 'stock.nasdaq.' + symbol.replace('.NAS', '');
                                    return [4 /*yield*/, testProxySymbol(name_1)];
                                case 1:
                                    isProxy = _a.sent();
                                    console.log(isProxy);
                                    if (isProxy) {
                                        stocks_1.push(name_1);
                                        console.log(name_1);
                                    }
                                    return [3 /*break*/, 10];
                                case 2:
                                    if (!symbol.endsWith('.NYSE')) return [3 /*break*/, 3];
                                    name_2 = 'stock.nyse.' + symbol.replace('.NYSE', '');
                                    return [3 /*break*/, 10];
                                case 3:
                                    if (!symbol.endsWith('.MAD')) return [3 /*break*/, 4];
                                    name_3 = 'stock.euronext.' + symbol.replace('.MAD', '.MD');
                                    return [3 /*break*/, 10];
                                case 4:
                                    if (!symbol.endsWith('.PAR')) return [3 /*break*/, 5];
                                    name_4 = 'stock.euronext.' + symbol.replace('.PAR', '.PA');
                                    return [3 /*break*/, 10];
                                case 5:
                                    if (!symbol.endsWith('.AMS')) return [3 /*break*/, 6];
                                    name_5 = 'stock.euronext.' + symbol.replace('.AMS', '.AS');
                                    return [3 /*break*/, 10];
                                case 6:
                                    if (!symbol.endsWith('.LSE')) return [3 /*break*/, 7];
                                    name_6 = 'stock.lse.' + symbol.replace('.LSE', '.L');
                                    return [3 /*break*/, 10];
                                case 7:
                                    if (!symbol.endsWith('.ETR')) return [3 /*break*/, 8];
                                    name_7 = 'stock.xetra.' + symbol.replace('.ETR', '.DE');
                                    return [3 /*break*/, 10];
                                case 8: return [4 /*yield*/, symbolStartsWithForex(symbol)];
                                case 9:
                                    isForex = _a.sent();
                                    if (isForex) {
                                        name_8 = 'forex.' + symbol;
                                    }
                                    _a.label = 10;
                                case 10: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error retrieving all symbols:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
retrieveAllSymbols();
