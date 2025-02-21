import { db } from '../config/firebaseConfig.js';

export const addDietaryPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const dietaryPlan = req.body;

    if (!dietaryPlan) {
      return res
        .status(400)
        .json({ success: false, message: 'Dietary plan data is required' });
    }

    // Save the dietary plan in Firestore under 'dietary' collection with player's UID as document ID
    await db.collection('dietary').doc(id).set(dietaryPlan);

    return res.status(201).json({
      success: true,
      message: 'Dietary plan added successfully',
    });
  } catch (error) {
    console.error('Error adding dietary plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not add dietary plan',
    });
  }
};
