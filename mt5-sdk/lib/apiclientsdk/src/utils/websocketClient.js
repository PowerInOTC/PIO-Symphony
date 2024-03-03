"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilientWebSocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
const logger_1 = __importDefault(require("./logger"));
const PING_TIMEOUT_DURATION = 30000; // 30s
class ResilientWebSocketClient {
    constructor(endpoint, token) {
        this.endpoint = endpoint;
        this.token = token ? token : undefined;
        this.wsFailedAttempts = 0;
        this.onError = (error) => {
            logger_1.default.error('app', error.message);
        };
        this.wsUserClosed = true;
        this.onMessage = () => { };
        this.onReconnect = () => { };
    }
    async send(data) {
        //this.Logger?.info(`Sending ${data}`);
        await this.waitForMaybeReadyWebSocket();
        if (this.wsClient === undefined) {
            logger_1.default.error('app', 'Couldn\'t connect to the websocket server. Error callback is called.');
        }
        else {
            this.wsClient?.send(data);
        }
    }
    async startWebSocket() {
        if (this.wsClient !== undefined) {
            return;
        }
        logger_1.default.info('app', 'Creating Web Socket client.');
        const headers = this.token ? { Authorization: `Bearer ${this.token}` } : undefined;
        this.wsClient = new ws_1.default(this.endpoint, { headers: headers });
        this.wsUserClosed = false;
        this.wsClient.onopen = () => {
            this.wsFailedAttempts = 0;
            // Ping handler is undefined in browser side so heartbeat is disabled.
            if (this.wsClient.on !== undefined) {
                this.heartbeat();
            }
        };
        this.wsClient.onerror = (event) => {
            this.onError(event.error);
        };
        this.wsClient.onmessage = (event) => {
            this.onMessage(event.data);
        };
        this.wsClient.onclose = async (event) => {
            if (this.pingTimeout !== undefined) {
                clearInterval(this.pingTimeout);
            }
            if (event.code == 3000) {
                logger_1.default.info('app', event.reason);
                this.onError(new Error(event.reason));
            }
            else if (event.code == 1001) {
                logger_1.default.info('app', event.reason);
                this.onError(new Error(event.reason));
            }
            else if (this.wsUserClosed === false) {
                this.wsFailedAttempts += 1;
                this.wsClient = undefined;
                const waitTime = expoBackoff(this.wsFailedAttempts);
                logger_1.default.error('app', `Connection closed unexpectedly or because of timeout. Reconnecting after ${waitTime}ms.`);
                this.onError(new Error(`Connection closed unexpectedly or because of timeout. Reconnecting after ${waitTime}ms.`));
                await sleep(waitTime);
                this.restartUnexpectedClosedWebsocket();
            }
            else {
                logger_1.default.info('app', 'The connection has been closed successfully.');
            }
        };
        if (this.wsClient.on !== undefined) {
            // Ping handler is undefined in browser side
            this.wsClient.on("ping", this.heartbeat.bind(this));
        }
        await this.waitForMaybeReadyWebSocket();
        if (this.wsClient == undefined || this.wsClient.readyState !== this.wsClient.OPEN) {
            return false;
        }
        return true;
    }
    /**
     * Heartbeat is only enabled in node clients because they support handling
     * ping-pong events.
     *
     * This approach only works when server constantly pings the clients which.
     * Otherwise you might consider sending ping and acting on pong responses
     * yourself.
     */
    heartbeat() {
        if (this.pingTimeout !== undefined) {
            clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = setTimeout(() => {
            logger_1.default.warn('app', 'Connection timed out. Reconnecting...');
            this.wsClient?.terminate();
            this.restartUnexpectedClosedWebsocket();
        }, PING_TIMEOUT_DURATION);
    }
    async waitForMaybeReadyWebSocket() {
        let waitedTime = 0;
        while (this.wsClient !== undefined &&
            this.wsClient.readyState !== this.wsClient.OPEN) {
            if (waitedTime > 5000) {
                this.wsClient.close();
                return;
            }
            else {
                waitedTime += 10;
                await sleep(10);
            }
        }
    }
    async restartUnexpectedClosedWebsocket() {
        if (this.wsUserClosed === true) {
            return;
        }
        await this.startWebSocket();
        //await this.waitForMaybeReadyWebSocket();
        if (this.wsClient === undefined) {
            logger_1.default.error('app', 'Couldn\'t reconnect to websocket. Error callback is called.');
            return;
        }
        this.onReconnect();
    }
    closeWebSocket() {
        if (this.wsClient !== undefined) {
            const client = this.wsClient;
            this.wsClient = undefined;
            client.close();
        }
        this.wsUserClosed = true;
    }
}
exports.ResilientWebSocketClient = ResilientWebSocketClient;
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function expoBackoff(attempts) {
    return 2 ** attempts * 100;
}
