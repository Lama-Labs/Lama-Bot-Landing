import OpenAI from 'openai';

// Create a singleton OpenAI client instance
const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default openaiClient; 