"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartCode = exports.sendErrorToTelegram = exports.sendMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
dotenv_1.default.config();
const bot_token = process.env.BOT_TOKEN;
const chat_id = process.env.CHAT_ID;
async function sendMessage(message) {
    try {
        const response = await axios_1.default.post(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
            chat_id: chat_id,
            text: message,
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
    }
}
exports.sendMessage = sendMessage;
async function sendErrorToTelegram(error) {
    const errorMessage = `Error:\n${error.name}: ${error.message}\n\nStack Trace:\n${error.stack}`;
    await sendMessage(errorMessage);
}
exports.sendErrorToTelegram = sendErrorToTelegram;
async function restartCode() {
    await sendMessage('Restarting code...');
    (0, child_process_1.exec)('pkill -f "pnpm start" && pnpm start', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error restarting code: ${error.message}`);
            sendMessage(`Error restarting code: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error restarting code: ${stderr}`);
            sendMessage(`Error restarting code: ${stderr}`);
            return;
        }
        console.log(`Code restarted: ${stdout}`);
        sendMessage('Code restarted successfully.');
    });
}
exports.restartCode = restartCode;
