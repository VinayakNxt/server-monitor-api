const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
require("dotenv").config(); // Load environment variables from .env file

const summaryRoute = require("./routes/summary.route"); // Import summary route
const summarizeMetrics = require("./openai/summarize"); // Import function to summarize metrics
const { fetchMetricsFromDB, closeConnection } = require('./src/db'); // Import database functions

const app = express();
const PORT = process.env.PORT || 3000; // Set the server port from environment variables or default to 3000

// Middleware
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use("/api", summaryRoute); // Use the summary route for API endpoints

// Root endpoint
app.get("/", (req, res) => res.send("Server Monitor API Running ✅")); // Health check endpoint

// Weekly metrics summary cron job
const cronJob = cron.schedule('0 12 * * 0', async () => { // Schedule job to run every Sunday at 12:00 PM
  console.log("Starting the weekly server metrics summary...");
  
  try {
    const metrics = await fetchMetricsFromDB(); // Fetch metrics data from the database
    
    if (!metrics || metrics.length === 0) { // Check if there is any data to summarize
      console.log('No metrics data found to summarize.');
      return;
    }

    const summaryResult = await summarizeMetrics(metrics); // Generate a summary of the metrics
    console.log("Summary Generated Successfully:", summaryResult); // Log the summary result
  } catch (error) {
    console.error("Error in cron job:", error.message); // Handle errors during the cron job
  }
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new requests
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      // Stop the cron job
      cronJob.stop();
      console.log('Cron job stopped.');
      
      // Close database connection
      await closeConnection();
      console.log('Database connection closed.');
      
      process.exit(0); // Exit the process successfully
    } catch (error) {
      console.error('Error during shutdown:', error); // Handle errors during shutdown
      process.exit(1); // Exit the process with an error code
    }
  });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`); // Log the server start message
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Handle termination signal
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Handle interrupt signal (e.g., Ctrl+C)
process.on('uncaughtException', (error) => { // Handle uncaught exceptions
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});