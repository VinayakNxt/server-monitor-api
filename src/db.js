// src/db.js

// Import the 'pg' module to interact with PostgreSQL
const { Client } = require('pg');

// Load environment variables from a .env file
require('dotenv').config(); 

// PostgreSQL client setup using environment variables
const client = new Client({
  host: process.env.DB_HOST,  // Database host (e.g., localhost or remote server)
  port: process.env.DB_PORT,  // Database port (default for PostgreSQL is 5432)
  user: process.env.DB_USER,  // Database username
  password: process.env.DB_PASSWORD, // Database password
  database: process.env.DB_NAME, // Database name
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,  // Enable SSL if DB_SSL is 'true'
});

// Initialize connection state
let isConnected = false;

// Function to ensure database connection
async function ensureConnection() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
    } catch (err) {
      console.error('Error connecting to database:', err);
      throw err;
    }
  }
}

// Function to fetch server metrics from the database
async function fetchMetricsFromDB() {
  try {
    // Connect to the PostgreSQL database
    await ensureConnection();

    // Execute a query to fetch all rows from the 'metrics' table
    const res = await client.query('SELECT * FROM metrics');  // Replace 'metrics' with your actual table name

    // Close the database connection
    await client.end();

    // Return the fetched rows as an array
    return res.rows;
  } catch (err) {
    // Log any errors that occur during the database operation
    console.error('Error fetching data from DB:', err);

    // Return an empty array in case of an error
    return [];
  }
}

async function closeConnection() {
  if (isConnected) {
    try {
      await client.end();
      isConnected = false;
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Export the fetchMetricsFromDB function for use in other modules
module.exports = { fetchMetricsFromDB, closeConnection };
