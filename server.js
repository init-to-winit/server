import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebaseConfig.js';
import authRoutes from './routes/authRoutes.js';
import dietaryRoutes from './routes/dietaryRoutes.js';
import healthcareRoutes from './routes/healthcareRoutes.js';
import athleteRoutes from './routes/athleteRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import fetchAllRoutes from './routes/fetchAllRoutes.js';
import genAIRoutes from './routes/genAIRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import uploadMediaRoutes from './routes/uploadMediaRoutes.js';
import profileVerificationRoutes from './routes/profileVerificationRoutes.js';

dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vismoh</title>
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
        }
        .container {
          text-align: center;
        }
        h1 {
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Vismoh backend</h1>
      </div>
    </body>
    </html>
  `);
});

app.use('/auth', authRoutes);
app.use('/dietary', dietaryRoutes);
app.use('/healthcare', healthcareRoutes);
app.use('/athlete', athleteRoutes);
app.use('/connect', connectionRoutes);
app.use('/all', fetchAllRoutes);
app.use('/suggestion', genAIRoutes);
app.use('/chat', chatRoutes);
app.use('/upload', uploadMediaRoutes);
app.use('/verify', profileVerificationRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});
