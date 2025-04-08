// openai/summarize.js
const axios = require("axios");
require("dotenv").config(); // Load environment variables from .env file

// Retrieve Azure OpenAI API endpoint and API key from environment variables
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;

/**
 * Summarizes server metrics using the Azure OpenAI API.
 * @param {Array} metrics - Array of server metrics objects.
 * @returns {Promise<string>} - A detailed summary and recommendations based on the metrics.
 */
async function summarizeMetrics(metrics) {
  // Step 1: Prepare the metrics for OpenAI API
  let metricsText = "Raw Server Metrics:\n";
  metrics.forEach((metric) => {
    // Format each metric into a readable text block
    metricsText += `
      Timestamp: ${metric.timestamp}
      Server Hostname: ${metric.server_hostname}
      CPU Usage: ${metric.cpu_usage}%
      CPU Cores: ${metric.cpu_cores}
      CPU Model: ${metric.cpu_model}
      CPU Speed: ${metric.cpu_speed} GHz
      CPU Load (1m): ${metric.cpu_load_1m}
      CPU Load (5m): ${metric.cpu_load_5m}
      CPU Load (15m): ${metric.cpu_load_15m}
      Memory Total: ${metric.memory_total} bytes
      Memory Free: ${metric.memory_free} bytes
      Memory Used: ${metric.memory_used} bytes
      Memory Percentage: ${metric.memory_percentage}%
      Disk Filesystem: ${metric.disk_filesystem}
      Disk Size: ${metric.disk_size} bytes
      Disk Used: ${metric.disk_used} bytes
      Disk Available: ${metric.disk_available} bytes
      Disk Percentage: ${metric.disk_percentage}%
      Network Interface: ${metric.network_interface}
      Network RX Bytes: ${metric.network_rx_bytes} bytes
      Network TX Bytes: ${metric.network_tx_bytes} bytes
      Network RX Rate: ${metric.network_rx_rate} bytes/sec
      Network TX Rate: ${metric.network_tx_rate} bytes/sec
      Network Connections: ${metric.network_connections}
      Created At: ${metric.created_at}
    `;
  });

  // Construct the prompt for the OpenAI API
  const prompt = `
  You are a server performance assistant specialized in infrastructure optimization. I am providing you with detailed server health metrics collected every 30 minutes over a one-week period for multiple servers in our infrastructure. Please analyze this data and provide the following for EACH SERVER SEPARATELY:

  ### For Each Server

  1. **Comprehensive Summary**:
    - **Overall Health**: Provide a high-level overview of this specific server's overall health and performance.
    - **Key Trends**: Summarize the key trends observed in the metrics, including daily/weekly variations in resource usage.
    - **Critical Usage Peaks**: Highlight any critical peaks in CPU, memory, disk, or network usage that may require attention.
    - **Stability Assessment**: Assess the stability of the server performance over the given period. Are there noticeable fluctuations or consistent resource exhaustion?

  2. **Anomalies & Issues**:
    - **Spikes & Drops**: Identify any sudden spikes or drops in resource usage (CPU, memory, disk, network) and their potential causes.
    - **Correlated Anomalies**: Correlate anomalies across multiple metrics (e.g., a CPU spike with a memory usage increase). Are there any patterns or repeated events?
    - **Threshold Approaching**: Identify any metrics that are approaching critical thresholds (e.g., CPU usage over 80%, memory over 90%, disk nearing full capacity).
    - **Abnormal Network Activity**: Look for unusual network activity, like spikes in incoming/outgoing traffic or too many network connections.

  3. **Root Cause Diagnosis**:
    - **Pattern Analysis**: Based on the metrics, what could be the root causes of performance issues? Are there any recurring patterns that point to potential problems (e.g., high load at specific times)?
    - **Scheduled Jobs or Traffic Impact**: Could scheduled jobs or heavy network traffic be causing temporary performance degradation? 
    - **Application vs. Infrastructure**: Do the metrics suggest issues at the application level (e.g., inefficient code) or infrastructure level (e.g., insufficient resources)?
    - **Critical Events**: Are there any isolated critical events or recurring issues that need further investigation?

  4. **Actionable Recommendations**:
    - **Short-Term Recommendations**: Provide immediate fixes or actions to address any current performance issues.
    - **Medium-Term Optimizations**: Suggest optimizations for resource utilization.
    - **Long-Term Strategies**: Recommend long-term strategies for server scaling, load balancing, and infrastructure upgrades.
    - **Infrastructure Planning**: Should we consider improving specific components?
    - **Monitoring Improvements**: Suggest additional metrics that should be monitored.
    - **Alerting Setup**: Advise on setting up performance alerts for critical thresholds.

  ### Cross-Server Comparison
  After analyzing each server individually, please provide:

  5. **Infrastructure-Wide Assessment**:
    - **Comparative Analysis**: How do the servers compare in terms of resource usage and performance? Which servers are under the most stress?
    - **Resource Balancing**: Are there opportunities to better balance workloads across servers?
    - **Common Issues**: Are there any common issues affecting multiple servers that might indicate systemic problems?
    - **Priority Ranking**: Rank the servers in order of which need the most immediate attention based on their health metrics.

  Raw Server Metrics:
  ${metricsText}

  Please provide a detailed and structured response with clear separation between each server's analysis. Use the server's hostname as a clear identifier in each section heading. Ensure your recommendations are specific, actionable, and prioritized based on severity.
`;

  // Prepare the request payload for the OpenAI API
  const data = {
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that analyzes raw server health data and provides optimization recommendations.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7, // Adjusts creativity
    max_tokens: 1500, // Set to allow detailed response
  };

  try {
    // Send the request to the Azure OpenAI API
    const res = await axios.post(endpoint, data, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    });

    // Return the generated summary, recommendations, and optimizations
    return res.data.choices[0].message.content;
  } catch (err) {
    // Log and return an error message if the API call fails
    console.error("❌ OpenAI API error:", err.response?.data || err.message);
    return "Sorry, something went wrong while generating the summary and recommendations.";
  }
}

// Export the summarizeMetrics function for use in other modules
module.exports = summarizeMetrics;
