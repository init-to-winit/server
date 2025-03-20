import { db } from '../config/firebaseConfig.js';

export const sendConnectionRequest = async (req, res) => {
  try {
    const { senderId, senderRole, receiverId, receiverRole } = req.body;

    if (!senderId || !receiverId || !senderRole || !receiverRole) {
      return res.status(400).json({
        success: false,
        message:
          'Sender ID, Receiver ID, Sender Role, and Receiver Role are required.',
      });
    }

    // Unique connection ID (avoids duplicate requests)
    const connectionId = `${senderId}_${receiverId}`;
    const connectionRef = db.collection('Connections').doc(connectionId);
    const existingConnection = await connectionRef.get();

    if (existingConnection.exists) {
      return res.status(400).json({
        success: false,
        message: 'Connection request already exists.',
      });
    }

    // Create a new connection request
    const newConnection = {
      senderId,
      receiverId,
      senderRole,
      receiverRole,
      status: 'pending', // Default status
      timestamp: new Date().toISOString(),
    };

    await connectionRef.set(newConnection);

    return res.status(201).json({
      success: true,
      message: 'Connection request sent successfully.',
    });
  } catch (error) {
    console.error('Error sending connection request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not send connection request.',
    });
  }
};

export const handleConnectionRequest = async (req, res) => {
  try {
    const { senderId, receiverId, action } = req.body;

    if (!senderId || !receiverId || !action) {
      return res.status(400).json({
        success: false,
        message:
          'Sender ID, Receiver ID, and Action (accept/reject) are required.',
      });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "reject".',
      });
    }

    const connectionId = `${senderId}_${receiverId}`;
    const connectionRef = db.collection('Connections').doc(connectionId);
    const existingConnection = await connectionRef.get();

    if (!existingConnection.exists) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found.',
      });
    }

    // Update the connection status
    const updatedStatus = action === 'accept' ? 'accepted' : 'rejected';
    await connectionRef.update({ status: updatedStatus });

    return res.status(200).json({
      success: true,
      message: `Connection request ${updatedStatus} successfully.`,
    });
  } catch (error) {
    console.error('Error handling connection request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not process connection request.',
    });
  }
};

export const getConnections = async (req, res) => {
  try {
    const { userId } = req.params; // The logged-in user ID

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    // Fetch connections where the user is either the sender or receiver
    const connectionsSnapshot = await db
      .collection('Connections')
      .where('senderId', '==', userId)
      .get();

    const receivedConnectionsSnapshot = await db
      .collection('Connections')
      .where('receiverId', '==', userId)
      .get();

    const sentConnections = connectionsSnapshot.docs.map((doc) => doc.data());
    const receivedConnections = receivedConnectionsSnapshot.docs.map((doc) =>
      doc.data()
    );

    // Function to fetch user details based on role and user ID
    const fetchUserData = async (role, id) => {
      let collectionName = '';
      if (role === 'Athlete') {
        collectionName = 'Athletes';
      } else if (role === 'Coach') {
        collectionName = 'Coaches';
      } else if (role === 'Sponsor') {
        collectionName = 'Sponsors';
      }

      if (collectionName) {
        const userDoc = await db.collection(collectionName).doc(id).get();
        return userDoc.exists ? userDoc.data() : null;
      }
      return null;
    };

    // Fetch user details for each connection
    const sentConnectionsWithData = await Promise.all(
      sentConnections.map(async (connection) => {
        const userData = await fetchUserData(
          connection.receiverRole,
          connection.receiverId
        );
        return {
          ...connection,
          receiverData: userData,
        };
      })
    );

    const receivedConnectionsWithData = await Promise.all(
      receivedConnections.map(async (connection) => {
        const userData = await fetchUserData(
          connection.senderRole,
          connection.senderId
        );
        return {
          ...connection,
          senderData: userData,
        };
      })
    );

    return res.status(200).json({
      success: true,
      sentConnections: sentConnectionsWithData,
      receivedConnections: receivedConnectionsWithData,
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch connections.',
    });
  }
};

export const getAllConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      });
    }

    // Fetch accepted connections where the user is either sender or receiver
    const connectionsSnapshot = await db
      .collection('Connections')
      .where('status', '==', 'accepted')
      .where('senderId', '==', userId)
      .get();

    const receivedConnectionsSnapshot = await db
      .collection('Connections')
      .where('status', '==', 'accepted')
      .where('receiverId', '==', userId)
      .get();

    const sentConnections = connectionsSnapshot.docs.map((doc) => doc.data());
    const receivedConnections = receivedConnectionsSnapshot.docs.map((doc) =>
      doc.data()
    );

    // Function to fetch user details
    const fetchUserData = async (role, id) => {
      const collectionMap = {
        Athlete: 'Athletes',
        Coach: 'Coaches',
        Sponsor: 'Sponsors',
      };
      const collectionName = collectionMap[role];
      if (!collectionName) return null;
      const userDoc = await db.collection(collectionName).doc(id).get();
      return userDoc.exists
        ? { id: userDoc.id, role, ...userDoc.data() }
        : null;
    };

    // Fetch user details for each connection
    const allConnectionsWithData = await Promise.all(
      [...sentConnections, ...receivedConnections].map(async (connection) => {
        const otherUserId =
          connection.senderId === userId
            ? connection.receiverId
            : connection.senderId;
        const otherUserRole =
          connection.senderId === userId
            ? connection.receiverRole
            : connection.senderRole;
        const userData = await fetchUserData(otherUserRole, otherUserId);
        return {
          ...connection,
          user: userData,
        };
      })
    );

    return res.status(200).json({
      success: true,
      connections: allConnectionsWithData,
    });
  } catch (error) {
    console.error('Error fetching accepted connections:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch connections.',
    });
  }
};

export const getAcceptedConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID is required.' });
    }

    // Fetch accepted connections where user is sender
    const connectionsSnapshot = await db
      .collection('Connections')
      .where('status', '==', 'accepted')
      .where('senderId', '==', userId)
      .get();

    // Fetch accepted connections where user is receiver
    const receivedConnectionsSnapshot = await db
      .collection('Connections')
      .where('status', '==', 'accepted')
      .where('receiverId', '==', userId)
      .get();

    // Extract connection data
    const sentConnections = connectionsSnapshot.docs.map((doc) => doc.data());
    const receivedConnections = receivedConnectionsSnapshot.docs.map((doc) =>
      doc.data()
    );

    // Extract connected user IDs and roles
    const connectedUsers = [
      ...sentConnections.map((conn) => ({
        id: conn.receiverId,
        role: conn.receiverRole,
      })),
      ...receivedConnections.map((conn) => ({
        id: conn.senderId,
        role: conn.senderRole,
      })),
    ];

    // Function to fetch user details based on role
    const fetchUserData = async (role, id) => {
      const collectionMap = {
        Athlete: 'Athletes',
        Coach: 'Coaches',
        Sponsor: 'Sponsors',
      };
      const collectionName = collectionMap[role];
      if (!collectionName) {
        return null;
      }
      const userDoc = await db.collection(collectionName).doc(id).get();
      return userDoc.exists
        ? { id: userDoc.id, role, ...userDoc.data() }
        : null;
    };

    // Fetch user details
    const users = await Promise.all(
      connectedUsers.map(async ({ id, role }) => {
        const userData = await fetchUserData(role, id);
        return userData;
      })
    );

    const filteredUsers = users.filter((user) => user !== null);

    return res.json({
      success: true,
      users: filteredUsers,
    });
  } catch (error) {
    console.error('Error fetching accepted connections:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' });
  }
};
