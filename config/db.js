// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,  // Choose the appropriate connection string
  ssl: {
    rejectUnauthorized: false,  // Adjust based on your SSL needs
  },
});

module.exports = pool;