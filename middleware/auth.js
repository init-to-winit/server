import admin from 'firebase-admin';

const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the request headers
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token);
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized: No token provided' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request object
    req.user = decodedToken;

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error,
    });
  }
};

export default verifyToken;
