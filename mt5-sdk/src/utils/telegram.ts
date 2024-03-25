import axios from 'axios';
import dotenv from 'dotenv';
import { exec } from 'child_process';

dotenv.config();

const bot_token = process.env.BOT_TOKEN;
const chat_id = process.env.CHAT_ID;

async function sendMessage(message: string): Promise<void> {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${bot_token}/sendMessage`,
      {
        chat_id: chat_id,
        text: message,
      },
    );
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendErrorToTelegram(error: Error): Promise<void> {
  const errorMessage = `Error:\n${error.name}: ${error.message}\n\nStack Trace:\n${error.stack}`;
  await sendMessage(errorMessage);
}

async function restartCode(): Promise<void> {
  await sendMessage('Restarting code...');
  exec('pkill -f "pnpm start" && pnpm start', (error, stdout, stderr) => {
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

export { sendMessage, sendErrorToTelegram, restartCode };
