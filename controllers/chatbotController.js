import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/firebaseConfig.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Generative AI client
const apiKey = process.env.GOOGLE_PROJECT_ID;
const genAI = new GoogleGenerativeAI(apiKey);

// Function to generate AI responses about sports, dietary healthcare, and performance improvement
const getAIResponse = async (prompt) => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 300, // Limit the output to 300 tokens for brevity
      },
    });

    // Generate content
    const result = await model.generateContent(prompt);

    // Extract and return the response text
    if (result && result.response) {
      // Trim the response to the first 500 characters to prevent overly long responses
      const responseText = result.response.text();
      return responseText.length > 500
        ? responseText.substring(0, 500) + '...'
        : responseText;
    }

    return 'No valid response received from AI.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Failed to generate response: ' + error.message;
  }
};

// Controller for the chatbot to answer about sports, dietary healthcare, and performance improvement
export const chatbotController = async (req, res) => {
  try {
    const { userId, question } = req.body;

    if (!userId || !question) {
      return res
        .status(400)
        .json({ error: 'User ID and question are required.' });
    }

    // Create a prompt based on the question
    const prompt = `As a sports health and performance advisor, answer the following question about athletic health, diet, and performance improvement concisely:\n\nQ: ${question}\nA:`;

    // Get the AI response
    const aiResponse = await getAIResponse(prompt);

    return res.status(200).json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error('Error in chatbot controller:', error);
    return res
      .status(500)
      .json({ error: 'Server error while processing your request.' });
  }
};
