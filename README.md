# Server Monitor API

This is a Node.js-based API for monitoring server health metrics. It collects data about server resources such as CPU, memory, disk, and network usage, and then generates a summary and recommendations based on the collected metrics using **OpenAI's API**.

## Features

- Collects server health metrics like CPU usage, memory usage, disk usage, network activity, etc.
- Summarizes server health and performance trends using **OpenAI's API**.
- Can be scheduled to run periodically using a **cron job**.
- Provides a **REST API** to manually trigger server metrics analysis and summary generation.

## Prerequisites

To run this project, you need the following:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **OpenAI API Key** (Azure OpenAI or OpenAI directly)
- **PostgreSQL Database** (or Supabase if you prefer)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/VinayakNxt/server-monitor-api.git
   cd server-monitor-api
