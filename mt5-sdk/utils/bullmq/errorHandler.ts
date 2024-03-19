// errorHandler.ts
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramGroupId = process.env.TELEGRAM_GROUP_ID;

const bot = new TelegramBot(telegramBotToken!);

export function errorHandler(error: Error) {
  console.error('Unhandled error:', error);

  // Send error message to Telegram group
  const errorMessage = `Unhandled Error:\n\n${error.stack}`;
  bot
    .sendMessage(telegramGroupId!, errorMessage)
    .then(() => {
      console.log('Error message sent to Telegram group');
    })
    .catch((err: Error) => {
      console.error('Failed to send error message to Telegram:', err);
    });
}
