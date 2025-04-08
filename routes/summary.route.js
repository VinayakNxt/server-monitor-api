// routes/summary.route.js
const express = require('express');
const { fetchMetricsFromDB } = require('../src/db'); // Import the DB fetch function
const summarizeMetrics = require('../openai/summarize'); // Assuming OpenAI logic exists here

const router = express.Router();

// Route to handle summary request
router.post('/summary', async (req, res) => {
  try {
    // Fetch metrics from the database
    const metrics = await fetchMetricsFromDB();

    // If no metrics are found, return an error
    if (metrics.length === 0) {
      return res.status(404).json({ error: 'No metrics data found.' });
    }

    // Send the metrics data to OpenAI for summarization
    const summary = await summarizeMetrics(metrics);

    // Return the summary and recommendations
    res.json({
      status: 'success',
      summary,
    });
  } catch (error) {
    console.error('Error in summary route:', error);
    res.status(500).json({ error: 'Failed to generate summary and recommendations.' });
  }
});

module.exports = router;
