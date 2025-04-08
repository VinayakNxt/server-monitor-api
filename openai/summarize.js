// openai/summarize.js
const axios = require("axios");
require("dotenv").config();
const sendMail = require("./mail"); // Assuming mail.js is in the same directory
const fs = require('fs').promises;
const path = require('path');

// Retrieve Azure OpenAI API endpoint and API key from environment variables
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;

/**
 * Summarizes server metrics using the Azure OpenAI API.
 * @param {Array} metrics - Array of server metrics objects.
 * @returns {Promise<string>} - A detailed summary and recommendations based on the metrics.
 */
async function summarizeMetrics(metrics, options = {}) {
  // Default options
  const config = {
    saveReport: true,
    emailReport: true,
    ...options
  };

  // Step 1: Prepare the metrics for OpenAI API
  let metricsText = "Raw Server Metrics:\n";
  metrics.slice(0,200).forEach((metric) => {
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
          "You are an assistant that analyzes raw server health data and provides comprehensive, actionable optimization recommendations.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7, // Adjusts creativity
    max_tokens: 2000, // Set to allow detailed response
  };

  try {
    // Send the request to the Azure OpenAI API
    const res = await axios.post(endpoint, data, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    });

    // Safely extract the summary
    const summary = res.data.choices[0]?.message?.content || 
                    "No summary was generated. Please check the API response.";

    // Prepare report results
    const reportResults = {
      summary,
      htmlReportPath: null,
      emailSent: false
    };

    // Generate HTML report if saving is enabled
    if (config.saveReport) {
      reportResults.htmlReportPath = await generateHTMLReport(summary);
    }

    // Send email if enabled
    if (config.emailReport) {
      // Get HTML content for email
      const htmlContent = await generateHTMLReport(summary, true);

      try {
        await sendMail(
          "vinayak@adaptnxt.com", // Replace with the recipient's email address
          "Server Metrics Summary Report",
          "Please find the detailed server metrics summary report below.",
          htmlContent
        );
        reportResults.emailSent = true;
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        reportResults.emailSent = false;
      }
    }

    return reportResults;
  } catch (err) {
    // Detailed error logging
    console.error("❌ OpenAI API error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });
    
    // More robust error handling
    if (err.response) {
      // The request was made and the server responded with a status code
      throw new Error(`API Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
    } else if (err.request) {
      // The request was made but no response was received
      throw new Error(`No response received: ${err.message}`);
    } else {
      // Something happened in setting up the request
      throw new Error(`Error setting up request: ${err.message}`);
    }
  }
}

/**
 * Generates an HTML report from the OpenAI summary
 * @param {string} summary - The summary text from OpenAI
 * @returns {Promise<string>} - Path to the generated HTML report
 */
async function generateHTMLReport(summary, returnContent = false) {
  // Create a structured HTML report
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Server Metrics Summary Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }
        .section {
            background-color: #f4f4f4;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .timestamp {
            font-size: 0.8em;
            color: #777;
            text-align: right;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>Server Metrics Summary Report</h1>
    <p class="timestamp">Generated on: ${new Date().toLocaleString()}</p>

    <div class="section">
        <pre>${summary.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
</body>
</html>
  `;

  // If returning content, skip file creation
  if (returnContent) {
    return htmlContent;
  }

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  // Generate unique filename
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
  const htmlFilePath = path.join(reportsDir, `server-metrics-report-${timestamp}.html`);
  
  // Write HTML file
  await fs.writeFile(htmlFilePath, htmlContent);

  return htmlFilePath;
}
// Export the summarizeMetrics function for use in other modules
module.exports = summarizeMetrics;
