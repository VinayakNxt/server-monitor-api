const axios = require("axios");
require("dotenv").config();
const sendMail = require("./mail"); // Assuming mail.js is in the same directory
const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf"); // Import jsPDF for PDF generation

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
    ...options,
  };

  // Step 1: Prepare the metrics for OpenAI API
  let metricsText = "Raw Server Metrics:\n";
  metrics.slice(0, 400).forEach((metric) => {
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
  Provide a precise, actionable summary for each unique server based on the following metrics collection. For each server, create a distinct 5-7 line overview that highlights:

  1. Overall server health and performance status
  2. Most critical resource utilization insights
  3. Potential performance bottlenecks or optimization opportunities
  4. Key recommendations or immediate actions

  Focus on clarity, specificity, and actionable intelligence. Use the Server Hostname as the primary identifier to distinguish between different servers.

  Server Metrics Details:
  ${metricsText}

  Requirements for Each Server Summary:
  - Use the Server Hostname as the section header
  - Provide a snapshot of server performance
  - Highlight any critical thresholds or approaching limits
  - Suggest 1-2 immediate actionable recommendations
  - Maintain a professional, concise tone
  - Prioritize insights based on potential impact on server performance

  Output Format:
  Host ID: [Server Hostname and please highlight the HOST ID by providing some color to it]
  [Concise 5-7 line summary with key insights and recommendations]

  1. Anomalies & Issues:
    - Spikes & Drops: Identify any sudden spikes or drops in resource usage (CPU, memory, disk, network) and their potential causes.
    - Correlated Anomalies: Correlate anomalies across multiple metrics (e.g., a CPU spike with a memory usage increase). Are there any patterns or repeated events?
    - Threshold Approaching: Identify any metrics that are approaching critical thresholds (e.g., CPU usage over 80%, memory over 90%, disk nearing full capacity).
    - Abnormal Network Activity: Look for unusual network activity, like spikes in incoming/outgoing traffic or too many network connections.

  2. Root Cause Diagnosis:
    - Pattern Analysis: Based on the metrics, what could be the root causes of performance issues? Are there any recurring patterns that point to potential problems (e.g., high load at specific times)?
    - Scheduled Jobs or Traffic Impact: Could scheduled jobs or heavy network traffic be causing temporary performance degradation? 
    - Application vs. Infrastructure: Do the metrics suggest issues at the application level (e.g., inefficient code) or infrastructure level (e.g., insufficient resources)?
    - Critical Events: Are there any isolated critical events or recurring issues that need further investigation?

  3. Actionable Recommendations:
    - Short-Term Recommendations: Provide immediate fixes or actions to address any current performance issues.
    - Medium-Term Optimizations: Suggest optimizations for resource utilization.
    - Long-Term Strategies: Recommend long-term strategies for server scaling, load balancing, and infrastructure upgrades.
    - Infrastructure Planning: Should we consider improving specific components?
    - Monitoring Improvements: Suggest additional metrics that should be monitored.
    - Alerting Setup: Advise on setting up performance alerts for critical thresholds.

  Host ID: [Next Server Hostname and please highlight the HOST ID by providing some color to it]
  [Concise 5-7 line summary for the next server]

  1. Anomalies & Issues:
    - Spikes & Drops: Identify any sudden spikes or drops in resource usage (CPU, memory, disk, network) and their potential causes.
    - Correlated Anomalies: Correlate anomalies across multiple metrics (e.g., a CPU spike with a memory usage increase). Are there any patterns or repeated events?
    - Threshold Approaching: Identify any metrics that are approaching critical thresholds (e.g., CPU usage over 80%, memory over 90%, disk nearing full capacity).
    - Abnormal Network Activity: Look for unusual network activity, like spikes in incoming/outgoing traffic or too many network connections.

  2. Root Cause Diagnosis:
    - Pattern Analysis: Based on the metrics, what could be the root causes of performance issues? Are there any recurring patterns that point to potential problems (e.g., high load at specific times)?
    - Scheduled Jobs or Traffic Impact: Could scheduled jobs or heavy network traffic be causing temporary performance degradation? 
    - Application vs. Infrastructure: Do the metrics suggest issues at the application level (e.g., inefficient code) or infrastructure level (e.g., insufficient resources)?
    - Critical Events: Are there any isolated critical events or recurring issues that need further investigation?

  3. Actionable Recommendations:
    - Short-Term Recommendations: Provide immediate fixes or actions to address any current performance issues.
    - Medium-Term Optimizations: Suggest optimizations for resource utilization.
    - Long-Term Strategies: Recommend long-term strategies for server scaling, load balancing, and infrastructure upgrades.
    - Infrastructure Planning: Should we consider improving specific components?
    - Monitoring Improvements: Suggest additional metrics that should be monitored.
    - Alerting Setup: Advise on setting up performance alerts for critical thresholds.

  Ensure each summary is unique, data-driven, and provides clear value to infrastructure management.
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
    const summary =
      res.data.choices[0]?.message?.content ||
      "No summary was generated. Please check the API response.";

    // Prepare report results
    const reportResults = {
      summary,
      htmlReportPath: null,
      emailSent: false,
      pdfPath: null,
    };

    // Generate HTML report if saving is enabled
    if (config.saveReport) {
      reportResults.htmlReportPath = await generateHTMLReport(summary);
    }

    try {
      reportResults.pdfPath = await generatePDFReport(summary);
      console.log(`PDF report generated successfully at: ${reportResults.pdfPath}`);
    } catch (pdfError) {
      console.error(`Failed to generate PDF report: ${pdfError.message}`);
      reportResults.pdfPath = null; // Set to null to indicate failure
    }
    // Send email if enabled
    if (config.emailReport) {
      // Get HTML content for email
      const htmlContent = await generateHTMLReport(summary, true);

      try {
        await sendMail(
          "Server Metrics Summary Report",
          "Please find the detailed server metrics summary report below.",
          htmlContent,
          reportResults.pdfPath // Attach the PDF file
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
      message: err.message,
    });

    // More robust error handling
    if (err.response) {
      // The request was made and the server responded with a status code
      throw new Error(
        `API Error: ${err.response.status} - ${JSON.stringify(
          err.response.data
        )}`
      );
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
    <title>Server Metrics Analysis Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #0056b3;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .highlight {
            background-color: #f8f9fa;
            border-left: 4px solid #0056b3;
            padding: 15px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Server Performance Analysis Report</h2>
    </div>
    
    <p>Hello,</p>
    
    <p>Please find attached the detailed Server Health Analysis Report generated on <strong>${new Date().toLocaleString()}</strong>.</p>
    
    <div class="highlight">
        <p>This report contains comprehensive analysis of your server infrastructure performance, including:</p>
        <ul>
            <li>Server health assessments</li>
            <li>Resource utilization trends</li>
            <li>Detected anomalies and performance issues</li>
            <li>Prioritized recommendations for optimization</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>This is an automated report. Please do not reply to this email.</p>
    </div>
</body>
</html>
  `;

  // If returning content, skip file creation
  if (returnContent) {
    return htmlContent;
  }

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  // Generate unique filename
  const timestamp = new Date().toISOString().replace(/[:\.]/g, "-");
  const htmlFilePath = path.join(
    reportsDir,
    `server-metrics-report-${timestamp}.html`
  );

  // Write HTML file
  await fs.writeFile(htmlFilePath, htmlContent);

  return htmlFilePath;
}

async function generatePDFReport(aiResponse, options = {}) {
  // Default configuration
  const config = {
    titlePrefix: 'Infrastructure Performance Insights',
    outputMode: 'file', // 'file' or 'buffer'
    fontConfig: {
      mainFont: 'helvetica',
      titleFontSize: 16,
      normalFontSize: 12,
      contentFontSize: 11
    },
    colorConfig: {
      titleColor: [0, 51, 102], // Dark blue
      normalColor: [0, 0, 0],   // Black
      footerColor: [100, 100, 100] // Gray
    },
    ...options
  };

  // Create a new PDF document
  const doc = new jsPDF();
  doc.setFont(config.fontConfig.mainFont);
  doc.setFontSize(config.fontConfig.normalFontSize);

  // Robust parsing of AI response
  function parseServerSections(response) {
    // Multiple parsing strategies to handle different AI response formats
    const parsingStrategies = [
      // Strategy 1: Split by explicit server section markers
      () => response.split(/###\s*Server\s*(?:Analysis|Report)\s*for/i)
        .filter(section => section.trim().length > 0),
      
      // Strategy 2: Split by hostname or server names
      () => {
        // Look for server identifiers (common patterns)
        const serverSplitRegex = /\b(Server|Host|Node)(?:\s*Name)?:\s*([^\n]+)/gi;
        const matches = [...response.matchAll(serverSplitRegex)];
        
        if (matches.length > 0) {
          return matches.map(match => {
            // Find the content for this server
            const serverName = match[2].trim();
            const serverContentRegex = new RegExp(`${serverName}[^\n]*\\n(.*?)(?=\\n\\w+:|$)`, 's');
            const contentMatch = response.match(serverContentRegex);
            return contentMatch ? contentMatch[1].trim() : '';
          }).filter(section => section.length > 0);
        }
        
        // Fallback: return entire response as a single section
        return [response];
      },
      
      // Strategy 3: Split by paragraphs if all else fails
      () => {
        // Split into paragraphs and filter out very short ones
        return response.split(/\n\s*\n/)
          .filter(p => p.trim().length > 50);
      }
    ];

    // Try parsing strategies until we get a valid result
    for (const strategy of parsingStrategies) {
      try {
        const sections = strategy();
        if (sections.length > 0) {
          return sections;
        }
      } catch (error) {
        console.warn('Parsing strategy failed:', error);
      }
    }

    // If all strategies fail, use entire response
    return [response];
  }

  // Extract server name or use a generic name
  function extractServerName(section) {
    // Try multiple methods to extract server name, prioritizing Host ID
    const namePatterns = [
      /Host ID:\s*\[([^\]]+)\]/i,   // Match Host ID: [server-name]
      /Host ID:\s*([^\n]+)/i,       // Match Host ID: server-name
      /`([^`]+)`/,                  // Markdown code block
      /Server Name:\s*([^\n]+)/i,   // Original patterns
      /Host(?:name)?:\s*([^\n]+)/i  // Original patterns
    ];

    for (const pattern of namePatterns) {
      const match = section.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Unknown Server';
  }

  // Process server sections
  const serverSections = parseServerSections(aiResponse);

  serverSections.forEach((section, index) => {
    // Add new page for subsequent servers
    if (index > 0) {
      doc.addPage();
    }

    // Extract server name
    const serverName = extractServerName(section);

    // Add title
    doc.setFontSize(config.fontConfig.titleFontSize);
    doc.setFont(config.fontConfig.mainFont, "bold");
    doc.setTextColor(...config.colorConfig.titleColor);
    doc.text(`${config.titlePrefix}`, 20, 20);

    // Add date
    doc.setFontSize(10);
    doc.setFont(config.fontConfig.mainFont, "normal");
    doc.text(`Report generated: ${new Date().toLocaleDateString()}`, 20, 30);

    // Add divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // Process report content
    let yPosition = 45;
    
    // Split content into lines, handling potential different formats
    const contentLines = doc.splitTextToSize(section, 170);

    doc.setFontSize(config.fontConfig.contentFontSize);
    doc.setFont(config.fontConfig.mainFont, "normal");
    doc.setTextColor(...config.colorConfig.normalColor);

    contentLines.forEach(line => {
      // Add page if near bottom
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });

    // Add footer
    doc.setFontSize(10);
    doc.setFont(config.fontConfig.mainFont, "italic");
    doc.setTextColor(...config.colorConfig.footerColor);
    doc.text("Confidential - For internal use only", 20, 285);
  });

  // Generate PDF data
  const pdfData = doc.output('arraybuffer');
  
  // Handle output mode
  if (config.outputMode === 'buffer') {
    return Buffer.from(pdfData);
  }

  // File output (default)
  try {
    // Ensure reports directory exists
    const reportsDir = path.resolve(__dirname, 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
    const pdfFilePath = path.join(reportsDir, `server-health-report-${timestamp}.pdf`);
    
    // Write PDF file
    await fs.writeFile(pdfFilePath, Buffer.from(pdfData));
    
    return pdfFilePath;
  } catch (error) {
    // Enhanced error handling
    console.error(`PDF generation error: ${error.message}`);
    
    // Fallback to system temp directory
    const os = require('os');
    const tempDir = path.join(os.tmpdir(), 'server-reports');
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
      const fallbackPath = path.join(tempDir, `server-health-report-${timestamp}.pdf`);
      
      await fs.writeFile(fallbackPath, Buffer.from(pdfData));
      
      return fallbackPath;
    } catch (fallbackError) {
      console.error(`Fallback save failed: ${fallbackError.message}`);
      throw new Error(`Failed to save PDF report: ${error.message}`);
    }
  }
}

module.exports = summarizeMetrics;
