import fs from 'fs';

export const loadContext = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data;
    } catch (error) {
        console.error(`Error reading file context from ${filePath}:`, error);
        return 'You are a helpful Twitch chatbot.';
    }
};
