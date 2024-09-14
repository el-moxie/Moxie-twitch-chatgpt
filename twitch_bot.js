import tmi from 'tmi.js';
import OpenAI from 'openai';
import { promises as fsPromises } from 'fs';  // Import fsPromises for file operations

export class TwitchBot {
    constructor(bot_username, oauth_token, channels, openai_api_key, enable_tts) {
        this.channels = channels;
        this.client = new tmi.Client({
            connection: {
                reconnect: true,
                secure: true
            },
            identity: {
                username: bot_username,
                password: oauth_token
            },
            channels: this.channels
        });
        this.openai = new OpenAI({ apiKey: openai_api_key });
        this.enable_tts = enable_tts;

        this.regulars = {};  // Track regulars (VIPs, Mods, and Subscribers)
    }

    // Determine if a user is a regular (VIP, Mod, or Subscriber)
    isRegular(userstate) {
        return userstate.mod || userstate.subscriber || (userstate.badges && userstate.badges.vip);
    }

    onMessage(callback) {
        this.client.on('message', (channel, userstate, message, self) => {
            // Check if the user is a regular
            userstate.regular = this.isRegular(userstate);

            // Call the original callback with updated userstate
            callback(channel, userstate, message, self);
        });
    }

    // Set up connection event handling using tmi.js
    onConnected(callback) {
        this.client.on('connected', callback);
    }

    // Set up disconnection event handling using tmi.js
    onDisconnected(callback) {
        this.client.on('disconnected', callback);
    }

    addChannel(channel) {
        // Check if channel is already in the list
        if (!this.channels.includes(channel)) {
            this.channels.push(channel);
            this.client.join(channel);
        }
    }

    connect() {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                await this.client.connect();
            } catch (error) {
                console.error(error);
            }
        })();
    }

    disconnect() {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                await this.client.disconnect();
            } catch (error) {
                console.error(error);
            }
        })();
    }

    say(channel, message) {
        // Use async/await syntax to handle promises
        (async () => {
            try {
                await this.client.say(channel, message);
            } catch (error) {
                console.error(error);
            }
        })();
    }

    async sayTTS(channel, text, userstate) {
        if (this.enable_tts !== 'true') {
            return;
        }
        try {
            const mp3 = await this.openai.audio.speech.create({
                model: 'tts-1',
                voice: 'alloy',
                input: text,
            });
            const buffer = Buffer.from(await mp3.arrayBuffer());
            const filePath = './public/file.mp3';
            await fsPromises.writeFile(filePath, buffer);
            return filePath;
        } catch (error) {
            console.error('Error in sayTTS:', error);
        }
    }

    whisper(username, message) {
        (async () => {
            try {
                await this.client.whisper(username, message);
            } catch (error) {
                console.error(error);
            }
        })();
    }

    ban(channel, username, reason) {
        (async () => {
            try {
                await this.client.ban(channel, username, reason);
            } catch (error) {
                console.error(error);
            }
        })();
    }

    unban(channel, username) {
        (async () => {
            try {
                await this.client.unban(channel, username);
            } catch (error) {
                console.error(error);
            }
        })();
    }

    clear(channel) {
        (async () => {
            try {
                await this.client.clear(channel);
            } catch (error) {
                console.error(error);
            }
        })();
    }

    color(channel, color) {
        (async () => {
            try {
                await this.client.color(channel, color);
            } catch (error) {
                console.error(error);
            }
        })();
    }

    commercial(channel, seconds) {
        (async () => {
            try {
                await this.client.commercial(channel, seconds);
            } catch (error) {
                console.error(error);
            }
        })();
    }
}
