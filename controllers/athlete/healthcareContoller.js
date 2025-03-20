import { db } from '../../config/firebaseConfig.js';

export const addHealthcare = async (req, res) => {
  try {
    const { id } = req.params; // Player UID
    const { injury_history, hydration_level, sleep_hours, height, weight } =
      req.body;

    // Check required fields
    if (!hydration_level || !sleep_hours || !height || !weight) {
      return res.status(400).json({
        success: false,
        message:
          'Hydration level, sleep hours, height, and weight are required',
      });
    }

    // Calculate BMI (Body Mass Index) = weight (kg) / (height (m) * height (m))
    const heightInMeters = height / 100; // Convert height from cm to meters
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2); // Keep 2 decimal places

    const healthcareData = {
      injury_history: injury_history || {}, // Default to empty object if not provided
      hydration_level,
      sleep_hours,
      height,
      weight,
      bmi,
    };

    // Save the healthcare data in Firestore under 'Healthcare' collection with player's UID as document ID
    await db.collection('Healthcare').doc(id).set(healthcareData);

    return res.status(201).json({
      success: true,
      message: 'Healthcare data added successfully',
      bmi,
    });
  } catch (error) {
    console.error('Error adding healthcare data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not add healthcare data',
    });
  }
};

export const editHealthcare = async (req, res) => {
  try {
    const { id } = req.params; // Player UID
    const { injury_history, hydration_level, sleep_hours, bmi } = req.body;

    // Get the existing healthcare data
    const healthcareRef = db.collection('Healthcare').doc(id);
    const doc = await healthcareRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Healthcare data not found for this player',
      });
    }

    const existingData = doc.data();

    // Ensure injury_history is an array; if Firestore has undefined/null, default to an empty array
    let updatedInjuryHistory = Array.isArray(existingData.injury_history)
      ? existingData.injury_history
      : [];

    if (Array.isArray(injury_history) && injury_history.length > 0) {
      // Append new injuries to existing ones
      updatedInjuryHistory = [...updatedInjuryHistory, ...injury_history];
    }

    // Update only provided fields
    const updatedHealthcareData = {
      injury_history: updatedInjuryHistory,
      hydration_level: hydration_level ?? existingData.hydration_level,
      sleep_hours: sleep_hours ?? existingData.sleep_hours,
      bmi: bmi ?? existingData.bmi,
    };

    // Update the document in Firestore
    await healthcareRef.update(updatedHealthcareData);

    return res.status(200).json({
      success: true,
      message: 'Healthcare data updated successfully',
    });
  } catch (error) {
    console.error('Error updating healthcare data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not update healthcare data',
    });
  }
};

export const getHealthcareDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const healthcareDoc = await db.collection('Healthcare').doc(id).get();

    if (!healthcareDoc.exists) {
      return res.status(404).json({
        success: true,
        message: 'Healthcare details not available in database',
        healthcareDetails: [],
      });
    }

    return res.status(200).json({
      success: true,
      healthcareDetails: healthcareDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching healthcare details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch healthcare details',
    });
  }
};
