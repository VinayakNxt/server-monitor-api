// routes/summary.route.js
const express = require('express');
const { fetchMetricsFromDBByHostname, getUniqueHostnames } = require('../src/db'); // Import the function to fetch metrics from the database
const summarizeMetrics = require('../openai/summarize'); // Import the function to summarize metrics using OpenAI

const router = express.Router();

// Route to handle summary request
router.post('/summary', async (req, res) => {
  try {
    // Step 1: Get all unique hostnames from the DB
    const hostnames = await getUniqueHostnames();

    if (!hostnames || hostnames.length === 0) {
      return res.status(404).json({ error: 'No hostnames found.' });
    }

    const results = [];

    // Step 2: Loop through each hostname, fetch metrics, summarize
    for (const hostname of hostnames) {
      const metrics = await fetchMetricsFromDBByHostname(hostname);
      console.log(`📊 Fetched ${metrics.length} metrics for ${hostname}`);

      if (metrics && metrics.length > 0) {
        const summary = await summarizeMetrics(metrics);

        results.push({
          hostname,
          summary
        });
      } else {
        results.push({
          hostname,
          summary: 'No metrics available for this host.'
        });
      }
    }

    // Step 3: Send all summaries back
    res.json({
      status: 'success',
      results
    });

  } catch (error) {
    console.error('Error in summary route:', error);
    res.status(500).json({ error: 'Failed to generate summaries.' });
  }
});

// Export the router to be used in other parts of the application
module.exports = router;
