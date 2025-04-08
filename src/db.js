// src/db.js
const { Client } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// PostgreSQL client setup using environment variables
const client = new Client({
  host: process.env.DB_HOST,  // Use DB_HOST from .env
  port: process.env.DB_PORT,  // Use DB_PORT from .env
  user: process.env.DB_USER,  // Use DB_USER from .env
  password: process.env.DB_PASSWORD, // Use DB_PASSWORD from .env
  database: process.env.DB_NAME, // Use DB_NAME from .env
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,  // SSL connection
});

// Function to fetch server metrics from the database
async function fetchMetricsFromDB() {
  try {
    await client.connect();
    const res = await client.query('SELECT * FROM metrics');  // Replace with your actual table name
    await client.end();
    return res.rows; // Return the data as an array of rows
  } catch (err) {
    console.error('Error fetching data from DB:', err);
    return [];
  }
}

module.exports = { fetchMetricsFromDB };
