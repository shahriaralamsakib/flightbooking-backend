const express = require('express');
const router = express.Router();
const db = require('../config/db.js');
const { v4: uuidv4 } = require('uuid'); // UUID generation library

// Function to handle database interactions
async function runQuery(sql, values) {
  try {
    return await db.query(sql, values);
  } catch (err) {
    throw new Error(`Database interaction failed: ${err.message}`);
  }
}

// Function to verify that all required fields are present
function isRequestValid(data) {
  const fields = ['offer', 'dictionaries', 'travelerDetails', 'paymentDetails'];
  return fields.every(field => field in data);
}

// Endpoint '/receive-data'
router.post('/receive-data', async (req, res) => {
    const requestData = req.body;
    console.log('Incoming Request Data:', JSON.stringify(requestData, null, 2));
  
    // Validate request data
    if (!isRequestValid(requestData)) {
      return res.status(400).json({
        error: 'Required fields are missing. Include offer, dictionaries, travelerDetails, and paymentDetails.'
      });
    }
  
    const { offer, dictionaries, travelerDetails, paymentDetails } = requestData;
  
    // Log travelerDetails to debug
    console.log('Traveler Details:', travelerDetails);
  
    if (!travelerDetails) {
      return res.status(400).json({ error: 'travelerDetails is missing or improperly formatted' });
    }
  
    try {
      // Adjust the destructuring to match your payload structure
      const {
        title,
        firstName,
        lastName,
        dateOfBirth,             // Corrected from DOB
        nationality,
        passportNumber,
        passportIssuingCountry,
        passportExpiry,
        mobileNumber,            // Corrected from phoneNumber
        emailAddress             // Corrected from email
      } = travelerDetails;
  
      // Adjust paymentDetails as needed
      const { cardNumber, cardHolderName, cvv, expirationMonth, expirationYear } = paymentDetails;
  
      // Log critical fields for debugging
      console.log('Extracted emailAddress:', emailAddress);
      console.log('Extracted firstName:', firstName);
  
      if (!emailAddress) {
        return res.status(400).json({ error: 'Email address is missing from travelerDetails' });
      }
  
      // Generate UUID for user and insert into the users table
      const userId = uuidv4();
      const insertUserSql = `
        INSERT INTO users (id, firstName, lastName, email, phoneNumber, DOB, gender, submissiondate, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'pending') RETURNING id
      `;
      await runQuery(insertUserSql, [userId, firstName, lastName, emailAddress, mobileNumber, dateOfBirth, title]);
  
      // Insert Passport Details
      const passportId = uuidv4(); // Generate a UUID for the passport details
      const insertPassportSql = `
        INSERT INTO passport_details (id, userid, passportNumber, nationality, passportExpiry, passportIssuingCountry)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await runQuery(insertPassportSql, [passportId, userId, passportNumber, nationality, passportExpiry, passportIssuingCountry]);
  
      // Insert Payment Information
      const paymentId = uuidv4(); // Generate a UUID for the payment details
      const insertPaymentSql = `
        INSERT INTO payment_details (id, userid, cardNumber, cardHolderName, cvv, expirationMonth, expirationYear)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await runQuery(insertPaymentSql, [paymentId, userId, cardNumber, cardHolderName, cvv, expirationMonth, expirationYear]);
  
      // Insert Flight Booking Information
      const flightBookingId = uuidv4(); // Generate a UUID for the flight booking details
      const insertFlightDetailsSql = `
        INSERT INTO flight_booking_details (id, userid, flightDetails, dictionaries)
        VALUES ($1, $2, $3, $4)
      `;
      await runQuery(insertFlightDetailsSql, [flightBookingId, userId, JSON.stringify(offer), JSON.stringify(dictionaries)]);
  
      // Respond with success
      return res.status(200).json({ message: 'Data successfully stored in the database.' });
  
    } catch (err) {
      console.error('Database operation error:', err);
  
      // Provide a more detailed error message
      return res.status(500).json({
        error: 'An error occurred while saving data to the database.',
        details: err.message
      });
    }
  });
  
module.exports = router;
