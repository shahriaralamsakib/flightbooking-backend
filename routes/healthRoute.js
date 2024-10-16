// routes/healthCheckRoute.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db');  // Adjust the path as necessary

// Health check route
router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Check database connection
    res.status(200).json({
      status: 'UP',
      time: new Date(),
      database: {
        status: 'Connected',
        currentTime: result.rows[0].now,  // Current time from the database
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'DOWN',
      error: 'Database connection error',
    });
  }
});

module.exports = router;
