"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxAmountAssetInfo = exports.minAmountAssetInfo = exports.fundingShortInfo = exports.fundingLongInfo = exports.precisionInfo = exports.symbolInfo = exports.minAmountSymbol = exports.retrieveMaxNotional = exports.resetAccount = exports.manageSymbolInventory = exports.retrieveAllSymbols = exports.retrieveLatestTick = exports.getTotalOpenAmount = void 0;
const axios_1 = __importDefault(require("axios"));
//const apiBaseUrl = process.env.FAST_API;
const apiBaseUrl = 'http://20.55.0.76:8000';
//const apiBaseUrl = 'http://0.0.0.0:8000';
async function getTotalOpenAmount(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/get_total_open_amount/${symbol}`)).data.total_open_amount;
            }
            catch (error) {
                console.error('Error retrieving total open amount:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for getTotalOpenAmount');
            return 0;
    }
}
exports.getTotalOpenAmount = getTotalOpenAmount;
async function retrieveLatestTick(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/retrieve_latest_tick/${symbol}`))
                    .data;
            }
            catch (error) {
                console.error('Error retrieving latest tick:', error);
                return { bid: 0, ask: 0 };
            }
        default:
            console.error('Unsupported broker for retrieveLatestTick');
            return { bid: 0, ask: 0 };
    }
}
exports.retrieveLatestTick = retrieveLatestTick;
async function retrieveAllSymbols(broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/retrieve_all_symbols`)).data
                    .symbols;
            }
            catch (error) {
                console.error('Error retrieving all symbols:', error);
                return [];
            }
        default:
            console.error('Unsupported broker for retrieveAllSymbols');
            return [];
    }
}
exports.retrieveAllSymbols = retrieveAllSymbols;
async function manageSymbolInventory(symbol, amount, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return ((await axios_1.default.post(`${apiBaseUrl}/manage_symbol_inventory/${symbol}`, { amount })).status === 200);
            }
            catch (error) {
                console.error('Error managing symbol inventory:', error);
                return false;
            }
        default:
            console.error('Unsupported broker for manageSymbolInventory');
            return false;
    }
}
exports.manageSymbolInventory = manageSymbolInventory;
async function resetAccount(broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.post(`${apiBaseUrl}/reset_account`)).status === 200;
            }
            catch (error) {
                console.error('Error resetting account:', error);
                return false;
            }
        default:
            console.error('Unsupported broker for resetAccount');
            return false;
    }
}
exports.resetAccount = resetAccount;
async function retrieveMaxNotional(broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/retrieve_max_notional`)).data
                    .max_notional;
            }
            catch (error) {
                console.error('Error retrieving max notional:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for retrieveMaxNotional');
            return 0;
    }
}
exports.retrieveMaxNotional = retrieveMaxNotional;
async function minAmountSymbol(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/min_amount_symbol/${symbol}`))
                    .data.min_amount;
            }
            catch (error) {
                console.error('Error retrieving minimum amount:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for minAmountSymbol');
            return 0;
    }
}
exports.minAmountSymbol = minAmountSymbol;
async function symbolInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/symbol_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving symbol info:', error);
                return null;
            }
        default:
            console.error('Unsupported broker for symbolInfo');
            return null;
    }
}
exports.symbolInfo = symbolInfo;
async function precisionInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/precision_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving precision info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for precisionInfo');
            return 0;
    }
}
exports.precisionInfo = precisionInfo;
async function fundingLongInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/funding_long_info/${symbol}`))
                    .data;
            }
            catch (error) {
                console.error('Error retrieving funding long info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for fundingLongInfo');
            return 0;
    }
}
exports.fundingLongInfo = fundingLongInfo;
async function fundingShortInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/funding_short_info/${symbol}`))
                    .data;
            }
            catch (error) {
                console.error('Error retrieving funding short info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for fundingShortInfo');
            return 0;
    }
}
exports.fundingShortInfo = fundingShortInfo;
async function minAmountAssetInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/min_ammount_asset_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving minimum amount asset info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for minAmountAssetInfo');
            return 0;
    }
}
exports.minAmountAssetInfo = minAmountAssetInfo;
async function maxAmountAssetInfo(symbol, broker) {
    switch (broker) {
        case 'mt5.ICMarkets':
            try {
                return (await axios_1.default.get(`${apiBaseUrl}/max_ammount_asset_info/${symbol}`)).data;
            }
            catch (error) {
                console.error('Error retrieving maximum amount asset info:', error);
                return 0;
            }
        default:
            console.error('Unsupported broker for maxAmountAssetInfo');
            return 0;
    }
}
exports.maxAmountAssetInfo = maxAmountAssetInfo;
