// openai/summarize.js
const axios = require("axios");
require("dotenv").config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;

async function summarizeMetrics(metrics) {
  // Step 1: Prepare the metrics for OpenAI API
  let metricsText = "Raw Server Metrics:\n";
  metrics.forEach((metric) => {
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

  const prompt = `
    You are a server performance assistant specialized in infrastructure optimization. I am providing you with detailed server health metrics collected every 30 minutes over a one-week period for the following server. Please analyze this data and provide the following:

    1. **Comprehensive Summary**:
      - **Overall Health**: Provide a high-level overview of the server’s overall health and performance.
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
      - **Short-Term Recommendations**: Provide immediate fixes or actions to address any current performance issues. These could include adjustments to server configurations, stopping resource-heavy processes, or offloading tasks.
      - **Medium-Term Optimizations**: Suggest optimizations for resource utilization, such as optimizing memory management, disk cleanup, or network traffic handling.
      - **Long-Term Strategies**: Recommend long-term strategies for server scaling, load balancing, and infrastructure upgrades. Could the server benefit from additional resources or different configuration settings (e.g., CPU cores, RAM)?
      - **Infrastructure Planning**: Should we consider improving specific components (e.g., adding more storage, optimizing CPU utilization, or improving network throughput)?
      - **Monitoring Improvements**: Suggest additional metrics that should be monitored to provide better visibility into server health (e.g., adding more detailed memory usage tracking, network latency, etc.).
      - **Alerting Setup**: Advise on setting up performance alerts for critical thresholds, such as when CPU usage exceeds 85%, memory exceeds 80%, or disk usage hits 90%.

    Raw Server Metrics:
    ${metricsText}

    Please provide a detailed and structured response with specific numerical thresholds in your recommendations, and prioritize suggestions based on severity and potential impact. Ensure clarity in your insights and offer actionable next steps for each area of improvement.
  `;

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
    const res = await axios.post(endpoint, data, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    });

    // Return the generated summary, recommendations, and optimizations
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ OpenAI API error:", err.response?.data || err.message);
    return "Sorry, something went wrong while generating the summary and recommendations.";
  }
}

module.exports = summarizeMetrics;
