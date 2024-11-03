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
  const requiredFields = [
    'offer', 'dictionaries',
    'travelerDetails.title', 'travelerDetails.firstName', 'travelerDetails.lastName',
    'travelerDetails.dateOfBirth', 'travelerDetails.mobileNumber', 'travelerDetails.emailAddress',
    'paymentDetails.cardNumber', 'paymentDetails.cardHolderName', 'paymentDetails.cvv',
    'paymentDetails.expirationMonth', 'paymentDetails.expirationYear',
    'billingAddress.address', 'billingAddress.city', 'billingAddress.state',
    'billingAddress.postcode', 'billingAddress.country'
  ];

  for (const field of requiredFields) {
    const keys = field.split('.');
    let value = data;
    for (const key of keys) {
      value = value?.[key];
      if (!value) {
        return { isValid: false, missingField: field };
      }
    }
  }
  return { isValid: true };
}

async function generateUniqueReferenceNo() {
  let referenceNo;
  let isUnique = false;

  while (!isUnique) {
    referenceNo = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit number
    const result = await runQuery('SELECT 1 FROM users WHERE reference_no = $1', [referenceNo]);
    isUnique = result.rowCount === 0; // Ensure referenceNo is unique
  }

  return referenceNo;
}

// Endpoint '/receive-data'
router.post('/receive-data', async (req, res) => {
    const requestData = req.body;
    console.log('Incoming Request Data:', JSON.stringify(requestData, null, 2));
  
    // Validate request data
    if (!isRequestValid(requestData)) {
      return res.status(400).json({
        error: 'error: `Required field is missing or empty: ${validation.missingField}'
      });
    }
  
    const { offer, dictionaries, travelerDetails, paymentDetails, billingAddress } = requestData;
  
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
        mobileNumber,            // Corrected from phoneNumber
        emailAddress             // Corrected from email
      } = travelerDetails;
  
      // Adjust paymentDetails as needed
      const { cardNumber, cardHolderName, cvv, expirationMonth, expirationYear } = paymentDetails;

      const { address, city, state, postcode, country } = billingAddress;

      const referenceNo = await generateUniqueReferenceNo();
  
      // Log critical fields for debugging
      console.log('Extracted emailAddress:', emailAddress);
      console.log('Extracted firstName:', firstName);
  
      if (!emailAddress) {
        return res.status(400).json({ error: 'Email address is missing from travelerDetails' });
      }
  
      // Generate UUID for user and insert into the users table
      const userId = uuidv4();
      const insertUserSql = `
        INSERT INTO users (id, firstName, lastName, email, phoneNumber, DOB, gender, submissiondate, status, reference_no)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'pending', $8) RETURNING id
      `;
      await runQuery(insertUserSql, [userId, firstName, lastName, emailAddress, mobileNumber, dateOfBirth, title, referenceNo]);
  
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

      const billingId = uuidv4();
      const insertBillingSql = `
        INSERT INTO billing_address (id, userId, address, city, state, postCode, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      await runQuery(insertBillingSql, [billingId, userId, address, city, state, postcode, country]);


  
      return res.status(200).json({
        message: 'Data successfully stored in the database.',
        userId
      });
  
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
