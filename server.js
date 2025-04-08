const express = require("express");
const bodyParser = require("body-parser");
const cron = require("node-cron");  // Importing node-cron for cron job scheduling
require("dotenv").config();  // Loading environment variables

const summaryRoute = require("./routes/summary.route");  // Import your route handling summary requests
const summarizeMetrics = require("./openai/summarize");  // Assuming the summarize function is in this file
const { fetchMetricsFromDB } = require('./src/db');  // Fetching metrics from Supabase

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use("/api", summaryRoute);

app.get("/", (req, res) => res.send("Server Monitor API Running ✅"));

/**
 * Cron Job Setup
 * This job runs every Sunday at 12:00 PM (Noon) and generates the summary.
 */
cron.schedule('0 12 * * 0', async () => { // Runs every Sunday at 12:00 PM (Noon)
  try {
    console.log("Starting the weekly server metrics summary...");

    // Fetch metrics from Supabase (or your chosen data source)
    const metrics = await fetchMetricsFromDB();
    
    if (metrics.length === 0) {
      console.log('No metrics data found to summarize.');
      return;
    }

    // Generate summary using OpenAI API
    const summary = await summarizeMetrics(metrics);

    // Log the summary or take further actions (e.g., email)
    console.log("Summary Generated Successfully:");
    console.log(summary);  // Output the summary or send via email here
  } catch (error) {
    console.error("Error generating summary:", error);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
