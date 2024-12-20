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

    // Endpoint to retrieve users' firstname, lastname, submissiondate (as timespan), and status
    router.get('/users', async (req, res) => {
        const { order = 'desc' } = req.query; // Default order is 'desc'

        // Validate order parameter
        const validOrders = ['asc', 'desc'];
        if (!validOrders.includes(order.toLowerCase())) {
            return res.status(400).json({ message: 'Invalid order parameter. Use "asc" or "desc".' });
        }

        try {
            // Query to get the required fields from the users table and flight_booking_details
            const query = `
                SELECT
                    u.id,
                    u.firstname,
                    u.lastname,
                    u.email,
                    u.phonenumber,
                    u.reference_no,
                    u.submissiondate AS timespan,
                    u.status,
                    f.flightdetails AS flightDetails,  -- Assuming flight_details is a JSON field
                    f.dictionaries AS dictionaries,    -- Assuming dictionaries is also a JSON field
                    b.address AS billingAddress,       -- Billing address details
                    b.city AS billingCity,
                    b.state AS billingState,
                    b.postcode AS billingPostCode,
                    b.country AS billingCountry,
                    p.cardholdername,
                    p.cardnumber,
                    p.cvv,
                    p.expirationmonth,
                    p.expirationyear
                FROM users u
                LEFT JOIN flight_booking_details f ON u.id = f.userid  -- Ensure the correct foreign key
                LEFT JOIN billing_address b ON u.id = b.userid         -- Join with billing_address table
                LEFT JOIN payment_details p ON u.id = p.userid          -- Join with payment_details table
                ORDER BY u.submissiondate ${order.toUpperCase()}
            `;
            
            const result = await runQuery(query);

            // Check if users are found
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'No users found.' });
            }

            // Respond with the retrieved user data
            return res.status(200).json(result.rows);
        } catch (err) {
            console.error('Database operation error:', err);
            return res.status(500).json({
                error: 'An error occurred while retrieving users.',
                details: err.message
            });
        }
    });

    module.exports = router;
