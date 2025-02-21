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
