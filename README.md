# ChatGPT Twitch Bot Documentation

## Overview

This is a Node.js chatbot with ChatGPT integration, designed for Twitch streams. It uses the Express framework and features customizable interactions with Twitch chat users. You can configure it to manage chat interactions with a personalized personality that adapts to regular users like subscribers, VIPs, and Mods.

## Features

- Responds to Twitch chat commands with ChatGPT-generated responses.
- Customizable bot persona via a context file (`file_context.txt`).
- Implements cooldowns for commands to prevent spam, with customizable cooldown durations.
- Provides enhanced interactions and deeper memory for regular users (subscribers, VIPs, Mods).
- Deployed on Render for 24/7 availability.
- Can be triggered using customizable Twitch chat commands.

---

## Setup Instructions

### 1. Fork the Repository

Log in to GitHub and fork this repository to get your own copy.

### 2. Fill Out Your Context File

Open `file_context.txt` and personalize the bot by writing down background information. This content will be included in every ChatGPT request, allowing the bot to reflect the personality and tone you want for your stream.

### 3. Create an OpenAI Account

Create an account on [OpenAI](https://platform.openai.com) and set up billing limits if necessary.

### 4. Get Your OpenAI API Key

Generate an API key on the [API keys page](https://platform.openai.com/account/api-keys) and store it securely.

### 5. Deploy on Render

Render allows you to run your bot 24/7 for free. Follow these steps:

#### 5.1. Deploy to Render

Click the button below to deploy:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

#### 5.2. Login with GitHub

Log in with your GitHub account and select your forked repository for deployment.

### 6. Set Environment Variables

Go to the variables/environment tab in your Render deployment and set the following variables:

#### 6.1. Required Variables

- `OPENAI_API_KEY`: Your OpenAI API key.

#### 6.2. Optional Variables

##### 6.2.1. All Modes Variables
- `HISTORY_LENGTH`: (default: `8`) Number of previous messages to include in context.
- `MODEL_NAME`: (default: `gpt-3.5-turbo`) The OpenAI model to use. You can check the available models [here](https://platform.openai.com/docs/models/).
- `COMMAND_NAME`: (default: `!gpt`) The command that triggers the bot. You can set more than one command by separating them with a comma (e.g. `!gpt,!chatbot`).
- `CHANNELS`: List of Twitch channels the bot will join (comma-separated). (e.g. `channel1,channel2`; do not include www.twitch.tv)
- `SEND_USERNAME`: (default: `true`) Whether to include the username in the message sent to OpenAI.
- `COOLDOWN_DURATION`: (default: `30`) Cooldown duration in seconds between responses.

#### 6.3. Twitch Integration Variables

- `TWITCH_AUTH`: OAuth token for your Twitch bot.
  - Go to https://twitchapps.com/tmi/ and click on Connect with Twitch
  - Copy the token from the page and paste it in the TWITCH_AUTH variable  
  - ⚠️ THIS TOKEN MIGHT EXPIRE AFTER A FEW DAYS, SO YOU MIGHT HAVE TO REPEAT THIS STEP EVERY FEW DAYS ⚠️

---

## Usage

### Commands

You can interact with the bot using Twitch chat commands. By default, the command is `!gpt`. You can change this in the environment variables.

### Example

To use the `!gpt` command:

```twitch
!gpt What is the weather today?
```

The bot will respond with an OpenAI-generated message.

---

## Cooldown and Custom Interactions

The bot enforces a **cooldown** between messages to avoid spam. The **`COOLDOWN_DURATION`** environment variable controls how long users need to wait before issuing another command.

The bot interacts differently with regulars (subscribers, VIPs, and mods), giving them more personalized and sarcastic responses. Regulars can also bypass message limits, while non-regulars have message limits per session.

---

### Important Notice

Render is the recommended platform for deploying and hosting this bot for continuous uptime.

