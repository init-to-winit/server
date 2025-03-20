import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Generative AI client
const apiKey = process.env.GOOGLE_PROJECT_ID;
const genAI = new GoogleGenerativeAI(apiKey);

export const getAIResponse = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContent(prompt);

    if (result && result.response) {
      return result.response.text();
    }

    return 'No valid response received from AI.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate response: ' + error.message);
  }
};
