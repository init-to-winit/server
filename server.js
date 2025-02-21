import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebaseConfig.js';
import authRoutes from './routes/authRoutes.js';
import dietaryRoutes from './routes/dietaryRoutes.js';
import healthcareRoutes from './routes/healthcareRoutes.js';
import athleteRoutes from './routes/athleteRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';

dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send('Vismoh Backend Running!');
});

app.use('/auth', authRoutes);
app.use('/dietary', dietaryRoutes);
app.use('/healthcare', healthcareRoutes);
app.use('/athlete', athleteRoutes);
app.use('/connect', connectionRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});
