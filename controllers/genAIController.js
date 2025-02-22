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
    const prompt = `Generate a dietary plan for an athlete. Return the suggested values and rationales in JSON format as shown below.

Example JSON Output:
{
  "calorie_suggestion": "[calories]",
  "protein_suggestion": "[grams]",
  "carbs_suggestion": "[grams]",
  "fats_suggestion": "[grams]",
  "breakfast_suggestion": "[items]",
  "lunch_suggestion": "[items]",
  "dinner_suggestion": "[items]",
  "food_rationale": "[rationale of food]",
  "hydration_suggestion": "[suggested water intake in liters]",
  "hydration_rationale": "[rationale]"
}

Athlete Data:
{
  "dietaryPlan": ${JSON.stringify(dietaryData)},
  "healthcareDetails": ${JSON.stringify(healthcareData)},
  "performanceDetails": ${JSON.stringify(performanceData)}
}`;

    const dietarySuggestion = await getAIResponse(prompt);

    // Clean the AI response to remove the code block markdown and parse as JSON
    const cleanedResponse = dietarySuggestion.replace(/^```json\n|\n```$/g, ''); // Remove ```json and closing ```
    const suggestionData = JSON.parse(cleanedResponse);

    return res.json({
      success: true,
      dietarySuggestion: suggestionData,
    });
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

    const prompt = `Provide performance improvement suggestions. Return values and rationales in JSON format as shown below.

Example JSON Output:
{
 "training_frequencyn": "[sessions/week]",
  "training_frequency_rationale": "[rationale]",
  "strength_conditioning_focus": "[focus area]",
  "strength_rationale": "[rationale]",
  "mental_strategy_suggestion": "[strategy]",
  "mental_strategy_rationale": "[rationale]",
  "loss_analysis_suggestion": "[analysis focus]",
  "loss_analysis_rationale": "[rationale]"
}
Athlete Data:
{
  "performanceDetails": ${JSON.stringify(performanceData)},
  "healthcareDetails": ${JSON.stringify(healthcareData)}
}`;

    const performanceSuggestion = await getAIResponse(prompt);

    // Clean the AI response to remove the code block markdown and parse as JSON
    const cleanedResponse = performanceSuggestion.replace(
      /^```json\n|\n```$/g,
      ''
    ); // Remove ```json and closing ```
    const suggestionData = JSON.parse(cleanedResponse);

    return res.json({
      success: true,
      performanceSuggestion: suggestionData,
    });
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

    const prompt = `Generate healthcare recommendations. Return values and rationales in JSON format as shown below.
    Example JSON Output:
{
  "injury_management_suggestion": "[strategy]",
  "injury_management_rationale": "[rationale]",
  "sleep_hours_suggestion": "[hours (number)]",
  "sleep_hours_rationale": "[rationale]",
  "hydration_strategy_suggestion": "[level of hydration intake in liters]",
  "hydration_strategy_rationale": "[rationale]",
  "screening_suggestion": "[screening type]",
  "screening_rationale": "[rationale]"
}
Athlete Data:
{
  "healthcareDetails": ${JSON.stringify(healthcareData)},
  "performanceDetails": ${JSON.stringify(performanceData)}
}`;

    const healthcareSuggestion = await getAIResponse(prompt);

    // Clean the AI response to remove the code block markdown and parse as JSON
    const cleanedResponse = healthcareSuggestion.replace(
      /^```json\n|\n```$/g,
      ''
    ); // Remove ```json and closing ```
    const suggestionData = JSON.parse(cleanedResponse);

    return res.json({
      success: true,
      healthcareSuggestion: suggestionData,
    });
  } catch (error) {
    console.error('Error fetching healthcare suggestions:', error);
    return res
      .status(500)
      .json({ error: 'Failed to get healthcare suggestions' });
  }
};
