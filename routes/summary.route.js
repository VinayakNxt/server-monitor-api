// routes/summary.route.js
const express = require('express');
const { fetchMetricsFromDB } = require('../src/db'); // Import the function to fetch metrics from the database
const summarizeMetrics = require('../openai/summarize'); // Import the function to summarize metrics using OpenAI

const router = express.Router();

// Route to handle summary request
router.post('/summary', async (req, res) => {
  try {
    // Fetch metrics from the database
    const metrics = await fetchMetricsFromDB();

    // If no metrics are found, return a 404 error response
    if (metrics.length === 0) {
      return res.status(404).json({ error: 'No metrics data found.' });
    }

    // Send the fetched metrics to OpenAI for summarization
    const summary = await summarizeMetrics(metrics);

    // Return the generated summary in the response
    res.json({
      status: 'success',
      summary,
    });
  } catch (error) {
    // Log the error and return a 500 error response in case of failure
    console.error('Error in summary route:', error);
    res.status(500).json({ error: 'Failed to generate summary and recommendations.' });
  }
});

// Export the router to be used in other parts of the application
module.exports = router;
