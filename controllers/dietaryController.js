import { db } from '../config/firebaseConfig.js';

const validateDietaryPlan = (dietaryPlan) => {
  if (!dietaryPlan)
    return { valid: false, message: 'Dietary plan is required' };

  const {
    calories_per_day,
    protein_intake,
    carbs_intake,
    fats_intake,
    meal_plan,
  } = dietaryPlan;

  // Validate number fields
  if (typeof calories_per_day !== 'number' || calories_per_day <= 0) {
    return { valid: false, message: 'Invalid calories_per_day' };
  }

  // Validate required string fields
  const stringFields = { protein_intake, carbs_intake, fats_intake };
  for (const [key, value] of Object.entries(stringFields)) {
    if (typeof value !== 'string' || !value.trim()) {
      return { valid: false, message: `Invalid ${key}` };
    }
  }

  // Validate meal_plan array
  if (!Array.isArray(meal_plan) || meal_plan.length === 0) {
    return { valid: false, message: 'Meal plan must be a non-empty array' };
  }

  for (const meal of meal_plan) {
    if (
      !meal.meal ||
      typeof meal.meal !== 'string' ||
      !meal.items ||
      !Array.isArray(meal.items)
    ) {
      return {
        valid: false,
        message: 'Each meal must have a name and items array',
      };
    }
  }

  return { valid: true };
};

export const addDietaryPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { dietaryPlan } = req.body;

    // Validate dietary plan schema
    const validation = validateDietaryPlan(dietaryPlan);
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    // Save the dietary plan with a fixed schema
    await db.collection('Dietary').doc(id).set({ dietaryPlan });

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

export const updateDietaryPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body.dietaryPlan;

    if (!updates) {
      return res
        .status(400)
        .json({ success: false, message: 'No update data provided' });
    }

    // Fetch current dietary plan from Firestore
    const dietaryDoc = await db.collection('Dietary').doc(id).get();
    if (!dietaryDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: 'Dietary plan not found' });
    }

    let existingPlan = dietaryDoc.data().dietaryPlan;

    // Merge numerical and string fields
    const updatedPlan = { ...existingPlan, ...updates };

    // Handle meal plan updates (append or replace meals)
    if (updates.meal_plan) {
      const mealMap = new Map(
        existingPlan.meal_plan.map((meal) => [meal.meal, meal])
      );

      updates.meal_plan.forEach((meal) => {
        mealMap.set(meal.meal, meal); // Replace if exists, otherwise add
      });

      updatedPlan.meal_plan = Array.from(mealMap.values()); // Convert map back to array
    }

    // Validate the updated plan against schema
    const validation = validateDietaryPlan(updatedPlan);
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.message });
    }

    // Save updated dietary plan in Firestore
    await db.collection('Dietary').doc(id).update({ dietaryPlan: updatedPlan });

    return res.status(200).json({
      success: true,
      message: 'Dietary plan updated successfully',
    });
  } catch (error) {
    console.error('Error updating dietary plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not update dietary plan',
    });
  }
};

export const getDietaryPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch dietary plan from Firestore
    const dietaryDoc = await db.collection('Dietary').doc(id).get();

    if (!dietaryDoc.exists) {
      return res.status(404).json({
        success: true,
        message: 'Dietary plan not available in database',
        dietaryPlan: [],
      });
    }

    return res.status(200).json({
      success: true,
      dietaryPlan: dietaryDoc.data().dietaryPlan,
    });
  } catch (error) {
    console.error('Error fetching dietary plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error, could not fetch dietary plan',
    });
  }
};
