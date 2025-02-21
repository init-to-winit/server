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

    return res.status(200).json({
      success: true,
      sentConnections,
      receivedConnections,
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch connections.',
    });
  }
};
