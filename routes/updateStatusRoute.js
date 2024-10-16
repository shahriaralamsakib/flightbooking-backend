const express = require('express');
const router = express.Router();
const db = require('../config/db.js');

async function runQuery(sql, values) {
  try {
    return await db.query(sql, values);
  } catch (err) {
    throw new Error(`Database interaction failed: ${err.message}`);
  }
}

router.put('/users/:id/:status', async (req, res) => {
    const userId = req.params.id; // Get user ID from request parameters
    const status = req.params.status; // Get new status from request URL parameter
  
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }
  
    try {
      const query = `
        UPDATE users 
        SET status = $1 
        WHERE id = $2
      `;
  
      const result = await runQuery(query, [status, userId]);
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      return res.status(200).json({ message: 'User status updated successfully.' });
    } catch (err) {
      console.error('Database operation error:', err);
      return res.status(500).json({
        error: 'An error occurred while updating the user status.',
        details: err.message
      });
    }
});

  module.exports = router;