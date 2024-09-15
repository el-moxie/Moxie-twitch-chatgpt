import tmi from 'tmi.js';

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
        this.openai_api_key = openai_api_key;
        this.enable_tts = enable_tts;
        this.userMessages = {};  // Tracks message counts for users
    }

    // Determine if a user is a regular
    isRegular(userstate) {
        return userstate.mod || userstate.subscriber || (userstate.badges && userstate.badges.vip);
    }

    getUserMessageCount(username) {
        return this.userMessages[username] || 0;
    }

    incrementUserMessageCount(username) {
        if (!this.userMessages[username]) this.userMessages[username] = 0;
        this.userMessages[username]++;
    }

    onMessage(callback) {
        this.client.on('message', (channel, userstate, message, self) => {
            callback(channel, userstate, message, self);
        });
    }

    say(channel, message) {
        this.client.say(channel, message);
    }

    connect() {
        (async () => {
            try {
                await this.client.connect();
            } catch (error) {
                console.error(error);
            }
        })();
    }
}
