import { db } from '../config/firebaseConfig.js';

export const getAllCoaches = async (req, res) => {
  try {
    const coachesSnapshot = await db.collection('Coaches').get();

    if (coachesSnapshot.empty) {
      return res.status(404).json({
        success: true,
        message: 'No coaches found',
        coaches: [],
      });
    }

    const coaches = coachesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      coaches,
    });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch coaches',
    });
  }
};

export const getAllSponsors = async (req, res) => {
  try {
    const sponsorsSnapshot = await db.collection('Sponsors').get();

    if (sponsorsSnapshot.empty) {
      return res.status(404).json({
        success: true,
        message: 'No sponsors found',
        sponsors: [],
      });
    }

    const sponsors = sponsorsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      sponsors,
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch sponsors',
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const athletesSnapshot = await db.collection('Athletes').get();
    const coachesSnapshot = await db.collection('Coaches').get();
    const sponsorsSnapshot = await db.collection('Sponsors').get();

    const athletes = athletesSnapshot.docs.map((doc) => ({
      id: doc.id,
      role: 'Athlete',
      ...doc.data(),
    }));

    const coaches = coachesSnapshot.docs.map((doc) => ({
      id: doc.id,
      role: 'Coach',
      ...doc.data(),
    }));

    const sponsors = sponsorsSnapshot.docs.map((doc) => ({
      id: doc.id,
      role: 'Sponsor',
      ...doc.data(),
    }));

    const allUsers = [...athletes, ...coaches, ...sponsors];

    return res.status(200).json({
      success: true,
      users: allUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch users',
    });
  }
};

export const getAllAthletes = async (req, res) => {
  try {
    const athletesSnapshot = await db.collection('Athletes').get();

    if (athletesSnapshot.empty) {
      return res.status(404).json({
        success: true,
        message: 'No athletes found',
        athletes: [],
      });
    }

    const athletes = athletesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      athletes,
    });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch athletes',
    });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const performanceSnapshot = await db.collection('AthletePerformance').get();

    if (performanceSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No athlete performance data found',
        leaderboard: [],
      });
    }

    let leaderboardData = [];

    // Fetch athlete details from AthletePerformance collection
    for (const doc of performanceSnapshot.docs) {
      const { wins, losses } = doc.data();
      const athleteId = doc.id; // Athlete ID used as document ID

      // Fetch athlete details from Athletes collection
      const athleteDoc = await db.collection('Athletes').doc(athleteId).get();
      if (!athleteDoc.exists) continue; // Skip if athlete details not found

      const { firstName, lastName, sport } = athleteDoc.data();
      const totalMatches = wins + losses;
      const winRate =
        totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : 0;

      leaderboardData.push({
        athleteId,
        name: `${firstName} ${lastName}`,
        sport,
        wins,
        losses,
        winRate: `${winRate}%`,
      });
    }

    // Sort by win rate in descending order
    leaderboardData.sort((a, b) => b.winRate - a.winRate);

    // Assign rank
    leaderboardData = leaderboardData.map((athlete, index) => ({
      ...athlete,
      rank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      leaderboard: leaderboardData,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch leaderboard',
    });
  }
};
