import { db, auth } from '../config/firebaseConfig.js';
import admin from 'firebase-admin';

export const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dob,
      role,
      email,
      phone,
      password,
      sport,
      position,
    } = req.body;

    // Validate role
    if (!['Athlete', 'Coach', 'Sponsor'].includes(role)) {
      return res
        .status(400)
        .json({ error: 'Invalid role. Choose Athlete, Coach, or Sponsor' });
    }

    // Validate required fields based on role
    if (role === 'Athlete' && (!sport || !position)) {
      return res
        .status(400)
        .json({ error: 'Sport and position are required for Athlete' });
    }
    if (role === 'Coach' && !sport) {
      return res.status(400).json({ error: 'Sport is required for Coach' });
    }

    // Create Firebase Auth User using Admin SDK
    const userRecord = await auth.createUser({
      email,
      password,
      phoneNumber: phone,
      displayName: `${firstName} ${lastName}`,
    });

    const authId = userRecord.uid;

    // Set Firestore collection based on role
    const collection =
      role === 'Athlete'
        ? 'Athletes'
        : role === 'Coach'
        ? 'Coaches'
        : 'Sponsors';

    // Prepare user data for Firestore
    const userData = {
      authId,
      firstName,
      lastName,
      dob,
      role,
      email,
      phone,
      createdAt: new Date().toISOString(),
    };

    if (role === 'Athlete') {
      userData.sport = sport;
      userData.position = position;
    } else if (role === 'Coach') {
      userData.sport = sport;
    }

    // Save user in Firestore
    await db.collection(collection).doc(authId).set(userData);

    return res
      .status(201)
      .json({ message: 'User registered successfully', authId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in user with Firebase Authentication
    const userRecord = await auth.getUserByEmail(email);
    console.log(userRecord);
    const response = {
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      phoneNumber: userRecord.phoneNumber,
    };
    // Generate Firebase ID Token
    const token = await auth.createCustomToken(userRecord.uid);

    return res
      .status(200)
      .json({ message: 'Login successful', token: token, userData: response });
  } catch (error) {
    return res.status(500).json({ error: 'Invalid email or password' });
  }
};
