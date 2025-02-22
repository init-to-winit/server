import { db } from '../config/firebaseConfig.js';

export const addPerformance = async (req, res) => {
  try {
    const { id } = req.params; // Athlete UID
    const { total_matches, wins, losses, practice_sessions_per_week } =
      req.body;

    // Validation: Ensure required fields are provided
    if (
      total_matches === undefined ||
      wins === undefined ||
      losses === undefined ||
      practice_sessions_per_week === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All fields (total_matches, wins, losses, practice_sessions_per_week) are required',
      });
    }

    if (wins + losses > total_matches) {
      return res.status(400).json({
        success: false,
        message: 'Total wins and losses cannot exceed total matches',
      });
    }
    // Calculate win rate
    const win_rate =
      total_matches > 0 ? ((wins / total_matches) * 100).toFixed(2) : 0;

    // Determine player performance status
    let performance_status = 'Poor Form';
    if (win_rate >= 70) {
      performance_status = 'Good Form';
    } else if (win_rate >= 40) {
      performance_status = 'Average Performance';
    }

    // Data to be stored
    const performanceData = {
      total_matches,
      wins,
      losses,
      win_rate: parseFloat(win_rate), // Convert string to number
      practice_sessions_per_week,
      performance_status,
    };

    // Save the performance data in Firestore under 'AthletePerformance' collection
    await db.collection('AthletePerformance').doc(id).set(performanceData);

    return res.status(201).json({
      success: true,
      message: 'Performance data added successfully',
      data: performanceData,
    });
  } catch (error) {
    console.error('Error adding performance data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not add performance data',
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
