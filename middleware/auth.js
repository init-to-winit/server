import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';

// const verifyIdToken = async (req, res, next) => {
//   try {
//     // Get the token from the request headers
//     const token = req.headers.authorization?.split(' ')[1];
//     console.log(token);
//     if (!token) {
//       return res
//         .status(401)
//         .json({ success: false, message: 'Unauthorized: No token provided' });
//     }

//     // Verify the Firebase ID token
//     const decodedToken = await admin.auth().verifyIdToken(token);

//     // Attach user info to request object
//     req.user = decodedToken;

//     next(); // Proceed to the next middleware or route handler
//   } catch (error) {
//     return res.status(403).json({
//       success: false,
//       message: 'Invalid or expired token',
//       error: error,
//     });
//   }
// };

// export default verifyIdToken;

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized: No token provided' });
    }

    // Verify JWT
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken; // Attach user info

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: 'Invalid or expired token' });
  }
};

export default verifyToken;
