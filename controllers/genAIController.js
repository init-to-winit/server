import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../config/firebaseConfig.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Generative AI client
const apiKey = process.env.GOOGLE_PROJECT_ID;
const genAI = new GoogleGenerativeAI(apiKey);

const getAIResponse = async (prompt) => {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    // Generate content
    const result = await model.generateContent(prompt);

    // Extract and return the response text
    if (result && result.response) {
      return result.response.text();
    }

    return 'No valid response received from AI.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Failed to generate response: ' + error.message;
  }
};

export const getDietarySuggestions = async (req, res) => {
  try {
    const { athleteId } = req.params;

    // Fetch data from all collections in parallel
    const [athleteDoc, dietaryDoc, healthcareDoc, performanceDoc] =
      await Promise.all([
        db.collection('Athletes').doc(athleteId).get(),
        db.collection('Dietary').doc(athleteId).get(),
        db.collection('Healthcare').doc(athleteId).get(),
        db.collection('AthletePerformance').doc(athleteId).get(),
      ]);

    // Check if the athlete exists
    if (!athleteDoc.exists) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    // Extract data from documents (check if they exist)
    const dietaryData = dietaryDoc.exists ? dietaryDoc.data() : null;
    const healthcareData = healthcareDoc.exists ? healthcareDoc.data() : null;
    const performanceData = performanceDoc.exists
      ? performanceDoc.data()
      : null;

    // Validate that required data is available
    if (!dietaryData || !healthcareData || !performanceData) {
      return res
        .status(400)
        .json({ error: 'Incomplete data for dietary suggestions' });
    }

    // Construct AI prompt
    const prompt = `Generate a dietary plan for an athlete with the following data. Focus on improvements and adjustments to the existing plan. Provide recommendations on calorie intake, macronutrient ratios, meal plan modifications (including specific food suggestions), and hydration strategies. Explain the rationale behind each recommendation.

Athlete Data:
{
  "dietaryPlan": ${JSON.stringify(dietaryData)},
  "healthcareDetails": ${JSON.stringify(healthcareData)},
  "performanceDetails": ${JSON.stringify(performanceData)}
}`;

    const dietarySuggestion = await getAIResponse(prompt);
    return res.json({ success: true, dietarySuggestion });
  } catch (error) {
    console.error('Error fetching dietary suggestions:', error);
    return res.status(500).json({ error: 'Failed to get dietary suggestions' });
  }
};

export const getPerformanceSuggestions = async (req, res) => {
  try {
    const { athleteId } = req.params;

    const [athleteDoc, healthcareDoc, performanceDoc] = await Promise.all([
      db.collection('Athletes').doc(athleteId).get(),
      db.collection('Healthcare').doc(athleteId).get(),
      db.collection('AthletePerformance').doc(athleteId).get(),
    ]);

    if (!athleteDoc.exists) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const healthcareData = healthcareDoc.exists ? healthcareDoc.data() : null;
    const performanceData = performanceDoc.exists
      ? performanceDoc.data()
      : null;

    if (!healthcareData || !performanceData) {
      return res
        .status(400)
        .json({ error: 'Incomplete data for performance suggestions' });
    }

    const prompt = `Provide performance improvement suggestions for an athlete with the following data. Focus on training adjustments, mental performance strategies, strength and conditioning recommendations, and areas for improvement based on their wins/losses. Explain the reasoning behind each recommendation.

Athlete Data:
{
  "performanceDetails": ${JSON.stringify(performanceData)},
  "healthcareDetails": ${JSON.stringify(healthcareData)}
}`;

    const performanceSuggestion = await getAIResponse(prompt);
    return res.json({ success: true, performanceSuggestion });
  } catch (error) {
    console.error('Error fetching performance suggestions:', error);
    return res
      .status(500)
      .json({ error: 'Failed to get performance suggestions' });
  }
};

export const getHealthcareSuggestions = async (req, res) => {
  try {
    const { athleteId } = req.params;

    const [athleteDoc, healthcareDoc, performanceDoc] = await Promise.all([
      db.collection('Athletes').doc(athleteId).get(),
      db.collection('Healthcare').doc(athleteId).get(),
      db.collection('AthletePerformance').doc(athleteId).get(),
    ]);

    if (!athleteDoc.exists) {
      return res.status(404).json({ error: 'Athlete not found' });
    }

    const healthcareData = healthcareDoc.exists ? healthcareDoc.data() : null;
    const performanceData = performanceDoc.exists
      ? performanceDoc.data()
      : null;

    if (!healthcareData || !performanceData) {
      return res
        .status(400)
        .json({ error: 'Incomplete data for healthcare suggestions' });
    }

    const prompt = `Generate healthcare and injury prevention recommendations for an athlete with the following data. Focus on managing existing injuries, optimizing sleep, monitoring hydration, and identifying potential risk factors. Include recommendations for specific therapies or interventions. Explain the rationale behind each recommendation.

Athlete Data:
{
  "healthcareDetails": ${JSON.stringify(healthcareData)},
  "performanceDetails": ${JSON.stringify(performanceData)}
}`;

    const healthcareSuggestion = await getAIResponse(prompt);
    return res.json({ success: true, healthcareSuggestion });
  } catch (error) {
    console.error('Error fetching healthcare suggestions:', error);
    return res
      .status(500)
      .json({ error: 'Failed to get healthcare suggestions' });
  }
};
