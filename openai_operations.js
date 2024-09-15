import OpenAI from "openai";

export class OpenAIOperations {
    constructor(file_context, openai_key, model_name, history_length, user_history_length) {
        this.messages = [{ role: "system", content: file_context }];
        this.collective_messages = [...this.messages];  // Initialize collective chat memory
        this.user_messages = {};  // Object to store user-specific memories
        this.openai = new OpenAI({ apiKey: openai_key });
        this.model_name = model_name;
        this.history_length = history_length;  // History for collective chat
        this.user_history_length = user_history_length;  // History for individual users

        console.log("System Message (Persona) Loaded: ", file_context);
    }

    // Method to check the length of conversation history for collective memory
    check_collective_history_length() {
        console.log(`Collective Conversations in History: ${this.collective_messages.length - 1}/${this.history_length}`);
        if (this.collective_messages.length > this.history_length + 1) {
            console.log('Collective message limit exceeded. Removing oldest user and agent messages.');
            this.collective_messages.splice(1, 2);  // Keep the system message intact
        }
    }

    // Method to check the length of conversation history for individual users
    check_user_history_length(username) {
        if (!this.user_messages[username]) {
            this.user_messages[username] = [...this.messages];  // Initialize with the system message
        }
        console.log(`User (${username}) Conversations in History: ${this.user_messages[username].length - 1}/${this.user_history_length}`);
        if (this.user_messages[username].length > this.user_history_length + 1) {
            console.log(`User (${username}) message limit exceeded. Removing oldest user and agent messages.`);
            this.user_messages[username].splice(1, 2);  // Keep the system message intact
        }
    }

    // Make an OpenAI call for collective memory
    async make_openai_call_collective(text) {
        try {
            // Add user message to collective messages
            this.collective_messages.push({ role: "user", content: text });

            // Check if collective message history is exceeded
            this.check_collective_history_length();

            // OpenAI API call
            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: this.collective_messages,
                temperature: 0.8,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (response.choices) {
                let agent_response = response.choices[0].message.content;
                console.log(`Agent Response (Collective): ${agent_response}`);
                this.collective_messages.push({ role: "assistant", content: agent_response });
                return agent_response;
            } else {
                throw new Error("No choices returned from OpenAI");
            }
        } catch (error) {
            console.error("OpenAI Call Error (Collective): ", error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }

    // Make an OpenAI call for individual user memory
    async make_openai_call_user(text, username) {
        try {
            // Initialize user-specific memory if not present
            if (!this.user_messages[username]) {
                this.user_messages[username] = [...this.messages];
            }

            // Add user message to their specific memory
            this.user_messages[username].push({ role: "user", content: text });

            // Check if user-specific message history is exceeded
            this.check_user_history_length(username);

            // OpenAI API call for the user-specific memory
            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: this.user_messages[username],
                temperature: 0.8,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (response.choices) {
                let agent_response = response.choices[0].message.content;
                console.log(`Agent Response (User - ${username}): ${agent_response}`);
                this.user_messages[username].push({ role: "assistant", content: agent_response });
                return agent_response;
            } else {
                throw new Error("No choices returned from OpenAI");
            }
        } catch (error) {
            console.error(`OpenAI Call Error (User - ${username}): `, error);
            return "Sorry, something went wrong. Please try again later.";
        }
    }
}
