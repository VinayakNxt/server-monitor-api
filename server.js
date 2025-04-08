const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");  // Importing node-cron for cron job scheduling
require("dotenv").config();  // Loading environment variables from .env file

// Importing route for handling summary-related API requests
const summaryRoute = require("./routes/summary.route");

// Importing the summarize function to generate summaries using OpenAI
const summarizeMetrics = require("./openai/summarize");

// Importing function to fetch metrics data from the database (e.g., Supabase)
const { fetchMetricsFromDB } = require('./src/db');

const app = express();  // Initialize Express application
const PORT = 3000;  // Define the port the server will listen on

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

// Route all API requests starting with "/api" to the summary route
app.use("/api", summaryRoute);

// Root endpoint to check if the server is running
app.get("/", (req, res) => res.send("Server Monitor API Running ✅"));

/**
 * Cron Job Setup
 * This job runs every Sunday at 12:00 PM (Noon) and generates the weekly summary.
 */
cron.schedule('0 12 * * 0', async () => { // Cron expression: Runs every Sunday at 12:00 PM
  try {
    console.log("Starting the weekly server metrics summary...");

    // Fetch metrics data from the database
    const metrics = await fetchMetricsFromDB();
    
    // Check if there is any data to summarize
    if (metrics.length === 0) {
      console.log('No metrics data found to summarize.');
      return;  // Exit if no data is available
    }

    // Generate a summary using the OpenAI API
    const summary = await summarizeMetrics(metrics);

    // Log the generated summary or take further actions (e.g., send via email)
    console.log("Summary Generated Successfully:");
    console.log(summary);  // Output the summary
  } catch (error) {
    // Log any errors that occur during the summary generation process
    console.error("Error generating summary:", error);
  }
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
