// Import modules
import OpenAI from "openai";

export class OpenAIOperations {
    constructor(file_context, openai_key, model_name, history_length, per_user_memory) {
        this.messages = [{role: "system", content: file_context}];  // Collective chat memory
        this.perUserMemory = {};  // Store memory for individual users
        this.collectiveMemory = this.messages;
        this.openai = new OpenAI({
            apiKey: openai_key,
        });
        this.model_name = model_name;
        this.history_length = history_length; // For collective memory
        this.per_user_memory = per_user_memory; // For user-specific memory (15 interactions)

        console.log("System Message (Persona) Loaded: ", file_context);  // Add this log to verify
    }

    // Manage collective memory (for all users)
    check_collective_memory_length() {
        console.log(`Collective Conversations in History: ${(this.messages.length / 2)}/${this.history_length}`);
        if (this.messages.length > (this.history_length * 2)) {
            console.log('Collective message amount exceeded. Removing oldest user and agent messages.');
            this.messages.splice(1, 2);  // Remove the oldest pair (user/assistant)
        }
    }

    // Manage per-user memory
    check_user_memory_length(user) {
        console.log(`Conversations in History: ${((this.messages.length / 2) -1)}/${this.history_length}`);
        if (this.perUserMemory[user] && this.perUserMemory[user].length > (this.per_user_memory * 2)) {
            console.log(`User message amount exceeded for ${user}. Removing oldest messages.`);
            this.perUserMemory[user].splice(1, 2);  // Remove oldest user-agent pair
        }
    }

    // Add user messages to memory (handles both collective and per-user)
    add_user_message(user, text) {
        // Add to collective memory
        this.messages.push({role: "user", content: text});
        this.check_collective_memory_length();

        // Add to per-user memory if they are a subscriber/regular
        if (this.is_regular(user)) {
            if (!this.perUserMemory[user]) {
                this.perUserMemory[user] = [{role: "system", content: `You are chatting with ${user}.`}];
            }
            this.perUserMemory[user].push({role: "user", content: text});
            this.check_user_memory_length(user);
        }
    }

    // Call OpenAI for collective or per-user interactions
    async make_openai_call(user, text) {
        try {
            // Add user message to memory
            this.add_user_message(user, text);

            let chatHistory;
            if (this.is_regular(user)) {
                chatHistory = this.perUserMemory[user];  // Use personal memory
            } else {
                chatHistory = this.messages;  // Use collective memory
            }

            // Log system message to verify it's not overwritten
            console.log("System Message Before Sending to OpenAI:", this.messages[0]);

            // Make OpenAI call with the appropriate history
            const response = await this.openai.chat.completions.create({
                model: this.model_name,
                messages: chatHistory,
                temperature: 0.8,
                max_tokens: 512,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            if (response.choices) {
                let agent_response = response.choices[0].message.content.trim();
                console.log(`Agent Response: ${agent_response}`);

                // Add assistant response to the appropriate memory
                this.add_assistant_response(user, agent_response);
                return agent_response;
            } else {
                throw new Error("No choices returned from OpenAI");
            }
        } catch (error) {
            console.error(error);
            return "Oh great, something went wrong. Try again later.";
        }
    }

    // Add assistant responses to memory (both collective and per-user)
    add_assistant_response(user, response) {
        this.messages.push({role: "assistant", content: response});
        this.check_collective_memory_length();

        if (this.is_regular(user)) {
            this.perUserMemory[user].push({role: "assistant", content: response});
            this.check_user_memory_length(user);
        }
    }

    // Check if user is a regular/subscriber
    is_regular(user) {
        // This can be customized to check if a user is a subscriber/regular based on Twitch info
        return user.subscriber || user.regular;
    }
}
