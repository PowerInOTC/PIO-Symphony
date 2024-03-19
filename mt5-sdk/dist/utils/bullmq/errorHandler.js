"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
// errorHandler.ts
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramGroupId = process.env.TELEGRAM_GROUP_ID;
const bot = new node_telegram_bot_api_1.default(telegramBotToken);
function errorHandler(error) {
    console.error('Unhandled error:', error);
    // Send error message to Telegram group
    const errorMessage = `Unhandled Error:\n\n${error.stack}`;
    bot
        .sendMessage(telegramGroupId, errorMessage)
        .then(() => {
        console.log('Error message sent to Telegram group');
    })
        .catch((err) => {
        console.error('Failed to send error message to Telegram:', err);
    });
}
exports.errorHandler = errorHandler;
