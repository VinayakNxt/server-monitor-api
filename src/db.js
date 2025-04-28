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
// This function checks if the database connection is already established.
// If not, it attempts to connect to the database.
async function ensureConnection() {
  if (!isConnected) {
    try {
      // Attempt to connect to the database
      await client.connect();
      isConnected = true; // Update connection state
    } catch (err) {
      // Log and rethrow any connection errors
      console.error('Error connecting to database:', err);
      throw err;
    }
  }
}

// Function to fetch server metrics from the database
// This function retrieves all rows from the 'metrics' table in the database.
async function fetchMetricsFromDB() {
  try {
    // Ensure the database connection is established
    await ensureConnection();

    /**
     * Executes a SQL query to retrieve all metrics from the database
     * where the timestamp is within the last 7 days.
     */
    const res = await client.query(`
      SELECT * FROM metrics
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    `);

    // Return the fetched rows as an array
    return res.rows;
  } catch (err) {
    // Log any errors that occur during the database operation
    console.error('Error fetching data from DB:', err);

    // Return an empty array in case of an error
    return [];
  }
}

// Function to close the database connection
// This function ensures the database connection is properly closed.
async function closeConnection() {
  if (isConnected) {
    try {
      // Attempt to close the database connection
      await client.end();
      isConnected = false; // Update connection state
    } catch (err) {
      // Log any errors that occur while closing the connection
      console.error('Error closing database connection:', err);
    }
  }
}

// Export the fetchMetricsFromDB and closeConnection functions
// These functions can be used in other modules to interact with the database.
module.exports = { fetchMetricsFromDB, closeConnection };
