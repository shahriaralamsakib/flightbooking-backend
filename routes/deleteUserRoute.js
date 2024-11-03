// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db');  // Adjust the path as necessary

// Delete user by ID (ID passed in request body)
router.delete('/user', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      deletedUser: result.rows[0],  // Returns the deleted user details if needed
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
