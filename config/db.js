// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'FlightBooking',
    port: process.env.DB_PORT || 5432,
  });
  
  module.exports = {
    query: (text, params) => pool.query(text, params),
  };