import { db, auth } from '../../config/firebaseConfig.js';
import admin from 'firebase-admin';
import axios from 'axios';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your_custom_secret';

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
      bloodGroup,
      address,
      country,
      gender,
      experienceLevel,
      latitude,
      longitude,
      sponsorshipType,
      companyName,
    } = req.body;

    // Validate role
    if (!['Athlete', 'Coach', 'Sponsor'].includes(role)) {
      return res
        .status(400)
        .json({ error: 'Invalid role. Choose Athlete, Coach, or Sponsor' });
    }

    // Validate required fields based on role
    if (role === 'Athlete' && (!sport || !position || !experienceLevel)) {
      return res.status(400).json({
        error: 'Sport, position, and experience level are required for Athlete',
      });
    }
    if (role === 'Coach' && !sport) {
      return res.status(400).json({ error: 'Sport is required for Coach' });
    }

    // Validate address coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res
        .status(400)
        .json({ error: 'Latitude and longitude must be numbers' });
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
      bloodGroup,
      address,
      country,
      gender,
      latitude,
      longitude,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    if (role === 'Athlete') {
      userData.sport = sport;
      userData.position = position;
      userData.experienceLevel = experienceLevel;
    } else if (role === 'Coach') {
      userData.sport = sport;
    } else if (role === 'Sponsor') {
      userData.sponsorshipType = sponsorshipType;
      userData.companyName = companyName;
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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Firebase REST API URL for signing in
    const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
    const JWT_SECRET = process.env.JWT_SECRET;
    const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

    // Authenticate user with Firebase REST API
    const response = await axios.post(SIGN_IN_URL, {
      email,
      password,
      returnSecureToken: true,
    });

    const { idToken, localId, email: userEmail, displayName } = response.data;

    // Fetch user role, phone number, sport, and verification status from Firestore
    let role = null;
    let phoneNumber = '';
    let sport = null;
    let isVerified = false;

    const collections = ['Athletes', 'Coaches', 'Sponsors'];
    for (const collection of collections) {
      const userDoc = await db.collection(collection).doc(localId).get();
      if (userDoc.exists) {
        role =
          collection === 'Athletes'
            ? 'Athlete'
            : collection === 'Coaches'
            ? 'Coach'
            : 'Sponsor';

        const userData = userDoc.data();
        phoneNumber = userData?.phone || '';
        sport = userData?.sport || null;
        isVerified = userData?.isVerified || false;
        break;
      }
    }

    if (!role) {
      return res
        .status(403)
        .json({ error: 'User role not found. Contact support.' });
    }

    // Generate a custom JWT (valid for 7 days)
    const customToken = jwt.sign(
      {
        id: localId,
        email: userEmail,
        name: displayName || '',
        role,
        phoneNumber,
        sport,
        isVerified,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token: customToken,
      userData: {
        id: localId,
        email: userEmail,
        name: displayName || '',
        phoneNumber,
        role,
        sport,
        isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    return res.status(401).json({ error: 'Invalid email or password' });
  }
};
