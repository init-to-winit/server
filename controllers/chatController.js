import { rt } from "../config/firebaseConfig.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const chatId = senderId < receiverId ? `${senderId}_${receiverId}` : `${receiverId}_${senderId}`;
    const messageRef = rt.ref(`chats/${chatId}`).push();

    const newMessage = {
      senderId,
      receiverId,
      message,
      timestamp: Date.now(),
    };

    await messageRef.set(newMessage);
    return res.status(201).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Error sending message" });
  }
};

// Get chat messages between two users
export const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    if (!user1 || !user2) {
      return res.status(400).json({ error: "Missing user parameters" });
    }

    const chatId = user1 < user2 ? `${user1}_${user2}` : `${user2}_${user1}`;
    const messagesRef = rt.ref(`chats/${chatId}`);
    
    const snapshot = await messagesRef.once("value");
    const messages = snapshot.val();

    return res.status(200).json({ messages: messages ? Object.values(messages) : [] });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Error fetching messages" });
  }
};
