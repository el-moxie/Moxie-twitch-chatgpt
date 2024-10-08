import express from 'express';
import expressWs from 'express-ws';
import { job } from './keep_alive.js';
import { TwitchBot } from './twitch_bot.js';
import { loadContext } from './file_context.js';
import { OpenAIOperations } from './openai_operations.js';

// Start keep-alive cron job
job.start();
console.log(process.env);

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
const COOLDOWN_DURATION = parseInt(process.env.COOLDOWN_DURATION) || 30; // Use existing cooldown duration

// Parse command names and channels
const commandNames = COMMAND_NAME.split(',').map(cmd => cmd.trim().toLowerCase());
const channels = CHANNELS.split(',').map(channel => channel.trim());
const maxLength = 300; // Set max length to 300 characters

// Load bot persona (file_context.txt)
const fileContext = loadContext('./file_context.txt');

// Track user cooldowns
const userCooldowns = {};

// Setup Twitch bot and OpenAI operations
const bot = new TwitchBot(TWITCH_USER, TWITCH_AUTH, channels, OPENAI_API_KEY, ENABLE_TTS);
const openaiOps = new OpenAIOperations(fileContext, OPENAI_API_KEY, 'gpt-3.5-turbo', HISTORY_LENGTH, REGULAR_HISTORY_LENGTH);

// Connect bot and handle connection events
bot.client.connect();

// Listen for Twitch chat connection success
bot.client.on('connected', (addr, port) => {
    console.log(`Connected to Twitch chat at ${addr}:${port}`);
});

// Handle incoming Twitch messages and OpenAI responses with cooldown
bot.client.on('message', async (channel, userstate, message, self) => {
    if (self) return;

    const username = userstate.username;
    const now = Date.now();

    // Check if user is within the cooldown period
    if (userCooldowns[username] && now - userCooldowns[username] < COOLDOWN_DURATION * 1000) {
        const remainingCooldown = Math.ceil((COOLDOWN_DURATION * 1000 - (now - userCooldowns[username])) / 1000);
        // Send the cooldown message using /me to make it look like an action
        bot.say(channel, `/me Slow down @${username}, you need to chill ${remainingCooldown} more seconds before pestering me again.`);
        return;
    }

    try {
        console.log(`Received message from @${userstate.username}: ${message}`);

        // Check if message starts with any of the command names
        if (!commandNames.some(cmd => message.toLowerCase().startsWith(cmd))) {
            console.log(`Message from @${userstate.username} did not start with the command.`);
            return;
        }

        console.log(`Message from @${userstate.username} starts with the correct command.`);
        
        let response = '';

        // Check if the user is a regular (VIP, Mod, Subscriber)
        const isRegular = bot.isRegular(userstate);
        const userMessageCount = bot.getUserMessageCount(username);

        // If user is NOT a regular and has exceeded the message limit, prompt them to subscribe
        if (!isRegular && userMessageCount >= NON_REGULAR_LIMIT) {
            response = `Ummm @${username}, you've reached your message limit. Subscribe for unlimited responses!`;
            console.log(`Non-regular user @${username} has hit their message limit.`);
        } else {
            // If regular, or non-regular within their message limit, proceed with OpenAI response
            response = isRegular 
                ? await openaiOps.make_openai_call_user(message, username) // User-specific memory for regulars
                : await openaiOps.make_openai_call_collective(message); // Collective memory for non-regulars
            console.log(`Bot generated response for @${username}: ${response}`);
        }

        // Handle long responses
        if (response.length > maxLength) {
            const messages = response.match(new RegExp(`.{1,${maxLength}}`, 'g')).slice(0, 2); // Max 2 parts
            messages.forEach((msg, index) => {
                setTimeout(() => {
                    bot.say(channel, msg);
                    console.log(`Bot sent message part ${index + 1} to @${username}: ${msg}`);
                }, 1000 * index);
            });
        } else {
            bot.say(channel, response);
            console.log(`Bot sent message to @${username}: ${response}`);
        }

        // Increment message count for non-regular users
        bot.incrementUserMessageCount(username);
        console.log(`Incremented message count for @${username} to ${userMessageCount + 1}`);

        // Set the last interaction time for the user (to enforce cooldown)
        userCooldowns[username] = now;
    } catch (error) {
        console.error(`Error processing message from @${userstate.username}:`, error);
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
