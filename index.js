import express from 'express';
import expressWs from 'express-ws';
import { job } from './keep_alive.js';
import { TwitchBot } from './twitch_bot.js';
import { loadContext } from './file_context.js';
import { OpenAIOperations } from './openai_operations.js';

// Start keep-alive cron job
job.start();

// Setup express app
const app = express();
const expressWsInstance = expressWs(app);

// Load environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TWITCH_USER = process.env.TWITCH_USER || 'TwitchBotUser';
const TWITCH_AUTH = process.env.TWITCH_AUTH || 'oauth:your_oauth_token';
const CHANNELS = process.env.CHANNELS || 'YourChannel';
const ENABLE_TTS = process.env.ENABLE_TTS || 'false';
const HISTORY_LENGTH = 8;
const REGULAR_HISTORY_LENGTH = 15;
const NON_REGULAR_LIMIT = 5;
const COMMAND_NAME = process.env.COMMAND_NAME || '!gpt'; // Command prompt for the bot

// Parse command names and channels
const commandNames = COMMAND_NAME.split(',').map(cmd => cmd.trim().toLowerCase());
const channels = CHANNELS.split(',').map(channel => channel.trim());
const maxLength = 300; // Set max length to 300 characters

// Load bot persona (file_context.txt)
const fileContext = loadContext('./file_context.txt');

// Setup Twitch bot and OpenAI operations
const bot = new TwitchBot(TWITCH_USER, TWITCH_AUTH, channels, OPENAI_API_KEY, ENABLE_TTS);
const openaiOps = new OpenAIOperations(fileContext, OPENAI_API_KEY, 'gpt-3.5-turbo', HISTORY_LENGTH, REGULAR_HISTORY_LENGTH);

// Handle incoming Twitch messages and OpenAI responses
bot.onMessage(async (channel, userstate, message, self) => {
    if (self) return;

    // Check if message starts with any of the command names
    if (!commandNames.some(cmd => message.toLowerCase().startsWith(cmd))) return;

    // Strip the command from the message
    const userMessage = message.slice(COMMAND_NAME.length).trim();
    if (!userMessage) return;

    let response = '';
    const username = userstate.username;

    // Check if the user is a regular
    const isRegular = bot.isRegular(userstate);
    const userMessageCount = bot.getUserMessageCount(username);

    if (!isRegular && userMessageCount >= NON_REGULAR_LIMIT) {
        response = `You've reached the message limit. Subscribe for unlimited responses!`;
    } else {
        // If regular, use user-specific memory; otherwise, use collective memory
        response = isRegular 
            ? await openaiOps.make_openai_call_user(userMessage, username)
            : await openaiOps.make_openai_call_collective(userMessage);
    }

    // Handle long responses
    if (response.length > maxLength) {
        // Split into two 300-character messages, max 600 characters total
        const messages = response.match(new RegExp(`.{1,${maxLength}}`, 'g')).slice(0, 2); // Max 2 parts
        messages.forEach((msg, index) => {
            setTimeout(() => {
                bot.say(channel, msg);
            }, 1000 * index);
        });
    } else {
        bot.say(channel, response);
    }

    bot.incrementUserMessageCount(username);
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
