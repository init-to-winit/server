import { db } from '../config/firebaseConfig.js';

export const getAllCoaches = async (req, res) => {
  try {
    const { id, role } = req.body; // Requester ID & Role

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: 'Requester ID and role are required',
      });
    }

    // Fetch all coaches
    const coachesSnapshot = await db.collection('Coaches').get();

    if (coachesSnapshot.empty) {
      return res.status(404).json({
        success: true,
        message: 'No coaches found',
        coaches: [],
      });
    }

    const coaches = await Promise.all(
      coachesSnapshot.docs.map(async (doc) => {
        const coachData = doc.data();
        const coachId = doc.id;

        // Check both possible connection document IDs
        const connectionRef1 = await db
          .collection('Connections')
          .doc(`${id}_${coachId}`)
          .get();
        const connectionRef2 = await db
          .collection('Connections')
          .doc(`${coachId}_${id}`)
          .get();

        let connectionStatus = null; // Default to null if no connection exists
        if (connectionRef1.exists) {
          connectionStatus = connectionRef1.data().status;
        } else if (connectionRef2.exists) {
          connectionStatus = connectionRef2.data().status;
        }

        return {
          id: coachId,
          ...coachData,
          connectionStatus,
        };
      })
    );

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
    const { id, role } = req.body; // Requester ID & Role

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: 'Requester ID and role are required',
      });
    }

    // Fetch all sponsors
    const sponsorsSnapshot = await db.collection('Sponsors').get();

    if (sponsorsSnapshot.empty) {
      return res.status(404).json({
        success: true,
        message: 'No sponsors found',
        sponsors: [],
      });
    }

    const sponsors = await Promise.all(
      sponsorsSnapshot.docs.map(async (doc) => {
        const sponsorData = doc.data();
        const sponsorId = doc.id;

        // Check both possible connection document IDs
        const connectionRef1 = await db
          .collection('Connections')
          .doc(`${id}_${sponsorId}`)
          .get();
        const connectionRef2 = await db
          .collection('Connections')
          .doc(`${sponsorId}_${id}`)
          .get();

        let connectionStatus = null; // Default to null if no connection exists
        if (connectionRef1.exists) {
          connectionStatus = connectionRef1.data().status;
        } else if (connectionRef2.exists) {
          connectionStatus = connectionRef2.data().status;
        }

        return {
          id: sponsorId,
          ...sponsorData,
          connectionStatus,
        };
      })
    );

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
    const { id, role } = req.body; // Requester ID & Role

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: 'Requester ID and role are required',
      });
    }

    // Fetch all athletes
    const athletesSnapshot = await db.collection('Athletes').get();

    if (athletesSnapshot.empty) {
      return res.status(404).json({
        success: true,
        message: 'No athletes found',
        athletes: [],
      });
    }

    const athletes = await Promise.all(
      athletesSnapshot.docs.map(async (doc) => {
        const athleteData = doc.data();
        const athleteId = doc.id;

        // Check both possible connection document IDs
        const connectionRef1 = await db
          .collection('Connections')
          .doc(`${id}_${athleteId}`)
          .get();
        const connectionRef2 = await db
          .collection('Connections')
          .doc(`${athleteId}_${id}`)
          .get();

        let connectionStatus = null; // Default to null if no connection exists
        if (connectionRef1.exists) {
          connectionStatus = connectionRef1.data().status;
        } else if (connectionRef2.exists) {
          connectionStatus = connectionRef2.data().status;
        }

        return {
          id: athleteId,
          ...athleteData,
          connectionStatus,
        };
      })
    );

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
    const { id, role } = req.body; // User ID & Role (Coach, Sponsor, or Athlete)

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Role are required',
      });
    }

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
        totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(2) : '0.00';

      // Check connection status based on `sendId` and `receiverId`
      const connectionSnapshot = await db
        .collection('Connections')
        .where('senderId', 'in', [id, athleteId])
        .where('receiverId', 'in', [id, athleteId]) // Either the user or the athlete should be involved
        .limit(1)
        .get();

      let connectionStatus = null; // Default if no connection exists
      if (!connectionSnapshot.empty) {
        connectionStatus = connectionSnapshot.docs[0].data().status; // pending, approved, rejected
      }

      leaderboardData.push({
        athleteId,
        name: `${firstName} ${lastName}`,
        sport,
        wins,
        losses,
        winRate: parseFloat(winRate), // Ensure numeric sorting
        connectionStatus,
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

export const getAthlete = async (req, res) => {
  try {
    const { athleteId } = req.params;

    if (!athleteId) {
      return res
        .status(400)
        .json({ success: false, message: 'Athlete ID is required' });
    }

    // Fetch all required documents in parallel
    const [athleteSnap, dietarySnap, healthcareSnap, performanceSnap] =
      await Promise.all([
        db.collection('Athletes').doc(athleteId).get(),
        db.collection('Dietary').doc(athleteId).get(),
        db.collection('Healthcare').doc(athleteId).get(),
        db.collection('AthletePerformance').doc(athleteId).get(),
      ]);

    // Check if athlete exists
    if (!athleteSnap.exists) {
      return res
        .status(404)
        .json({ success: false, message: 'Athlete not found' });
    }

    // Get document data (if it exists)
    const athleteInfo = athleteSnap.data();
    const dietaryInfo = dietarySnap.exists ? dietarySnap.data() : {};
    const healthcareDetails = healthcareSnap.exists
      ? healthcareSnap.data()
      : {};
    const performanceStats = performanceSnap.exists
      ? performanceSnap.data()
      : {};

    // Construct structured response
    return res.status(200).json({
      success: true,
      athleteData: {
        basicInfo: athleteInfo,
        dietaryInfo: dietaryInfo,
        healthcareDetails: healthcareDetails,
        performanceStats: performanceStats,
      },
    });
  } catch (error) {
    console.error('Error fetching athlete data:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};
