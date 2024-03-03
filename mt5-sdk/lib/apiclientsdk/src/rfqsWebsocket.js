"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqWebsocketClient = void 0;
const websocketClient_1 = require("./utils/websocketClient");
const logger_1 = __importDefault(require("./utils/logger"));
const config_1 = require("./config");
class RfqWebsocketClient {
    constructor(onMessage, onError) {
        this.protocol = config_1.config.https ? 'wss' : 'ws';
        this.wsEndpoint = `${this.protocol}://${config_1.config.serverAddress}:${config_1.config.serverPort}/live-rfqs`;
        this.onMessageCallback = onMessage;
        this.onErrorCallback = onError;
    }
    async startWebSocket(token) {
        if (!this.wsEndpoint) {
            throw new Error("Websocket endpoint is undefined.");
        }
        if (this.wsClient) {
            throw new Error("wsClient is already set.");
        }
        this.wsClient = new websocketClient_1.ResilientWebSocketClient(this.wsEndpoint, token);
        this.wsClient.onError = this.onWsError.bind(this);
        this.wsClient.onReconnect = () => {
            // reconnection behavior
        };
        this.wsClient.onMessage = (data) => {
            let message;
            try {
                message = JSON.parse(data.toString());
                if (this.onMessageCallback) {
                    this.onMessageCallback(message);
                }
            }
            catch (e) {
                logger_1.default.error('app', `Error parsing message ${data.toString()} as JSON.`);
                this.onWsError(e);
                return;
            }
        };
        return await this.wsClient.startWebSocket();
    }
    closeWebSocket() {
        this.wsClient?.closeWebSocket();
        this.wsClient = undefined;
    }
    onWsError(error) {
        /*if (typeof process !== "undefined" && typeof process.exit === "function") {
            Logger.error('ws', `Caught an error: ${error}`);
            Logger.error('ws', 'Halting the process due to the websocket error');
            /*try {
                this.closeWebSocket();
                this.subscribeRfqs();
            } catch (error) {
                if (error instanceof Error) {
                    Logger.error('app', `Caught an error: ${error.message}`);
                }
            
        }
        else {
        Logger.error('ws', 'Cannot halt process. Please handle the websocket error.');
        }*/
        if (this.onErrorCallback) {
            this.onErrorCallback(error);
        }
    }
}
exports.RfqWebsocketClient = RfqWebsocketClient;
