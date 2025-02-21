import { db } from '../config/firebaseConfig.js';

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

export const updatePerformance = async (req, res) => {
  try {
    const { id } = req.params; // Athlete UID
    const { total_matches, wins, losses, practice_sessions_per_week } =
      req.body;

    const performanceRef = db.collection('AthletePerformance').doc(id);
    const doc = await performanceRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Performance data not found for this athlete',
      });
    }

    const existingData = doc.data();

    // Determine new values (fallback to existing if not provided)
    const updatedTotalMatches = total_matches ?? existingData.total_matches;
    const updatedWins = wins ?? existingData.wins;
    const updatedLosses = losses ?? existingData.losses;
    const updatedPracticeSessions =
      practice_sessions_per_week ?? existingData.practice_sessions_per_week;

    // Recalculate win rate only if wins or total matches are updated
    const updatedWinRate =
      updatedTotalMatches > 0
        ? ((updatedWins / updatedTotalMatches) * 100).toFixed(2)
        : 0;

    // Determine updated performance status
    let updatedPerformanceStatus = 'Poor Form';
    if (updatedWinRate >= 70) {
      updatedPerformanceStatus = 'Good Form';
    } else if (updatedWinRate >= 40) {
      updatedPerformanceStatus = 'Average Performance';
    }

    // Updated data
    const updatedPerformanceData = {
      total_matches: updatedTotalMatches,
      wins: updatedWins,
      losses: updatedLosses,
      win_rate: parseFloat(updatedWinRate), // Ensure it's stored as a number
      practice_sessions_per_week: updatedPracticeSessions,
      performance_status: updatedPerformanceStatus,
    };

    // Update Firestore document
    await performanceRef.update(updatedPerformanceData);

    return res.status(200).json({
      success: true,
      message: 'Performance data updated successfully',
      data: updatedPerformanceData,
    });
  } catch (error) {
    console.error('Error updating performance data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not update performance data',
    });
  }
};

export const getPerformanceDetails = async (req, res) => {
  try {
    const { id } = req.params; // Athlete UID

    const performanceDoc = await db
      .collection('AthletePerformance')
      .doc(id)
      .get();

    if (!performanceDoc.exists) {
      return res.status(404).json({
        success: true,
        message: 'Performance details not available in database',
        performanceDetails: [],
      });
    }

    return res.status(200).json({
      success: true,
      performanceDetails: performanceDoc.data(),
    });
  } catch (error) {
    console.error('Error fetching performance details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch performance details',
    });
  }
};
