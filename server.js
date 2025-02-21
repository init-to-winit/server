import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebaseConfig.js'; // Ensure the file has .js extension
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Vismoh Backend Running!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on: http://localhost:${PORT}`);
});
