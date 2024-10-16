const express = require('express');
const app = express();
const flightDetailUpdateRoute = require('./routes/flightDetailUpdateRoute.js');
const getUsersDetailsRoute = require('./routes/getUsersDetailsRoute.js');
const updateStatusRoute = require('./routes/updateStatusRoute.js');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();  // Load environment variables

// Database connection
const pool = require('./config/db');  // Corrected path
console.log('DB password is:', typeof process.env.DB_PASSWORD);

// Function to test the database connection
const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);
  } catch (err) {
    console.error('Database connection error', err);
  }
};

// Test the connection (no need to close the pool here, as it should stay open for other requests)
testConnection();
app.use(cors());

// Middleware
app.use(express.json());

// Routes
app.use('/api/flights', flightDetailUpdateRoute);
app.use('/api/flights', getUsersDetailsRoute);
app.use('/api/flights', updateStatusRoute);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
