const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");
require("dotenv").config();

const summaryRoute = require("./routes/summary.route");
const summarizeMetrics = require("./openai/summarize");
const { fetchMetricsFromDB, closeConnection } = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use("/api", summaryRoute);

// Root endpoint
app.get("/", (req, res) => res.send("Server Monitor API Running ✅"));

// Weekly metrics summary cron job
const cronJob = cron.schedule('0 12 * * 0', async () => {
  console.log("Starting the weekly server metrics summary...");
  
  try {
    const metrics = await fetchMetricsFromDB();
    
    if (!metrics || metrics.length === 0) {
      console.log('No metrics data found to summarize.');
      return;
    }

    const summaryResult = await summarizeMetrics(metrics);
    console.log("Summary Generated Successfully:", summaryResult);
  } catch (error) {
    console.error("Error in cron job:", error.message);
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
      
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});