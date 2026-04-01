const axios = require('axios');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * Call the FastAPI scoring service with answers + profile
 * Returns: { raw_score, max_possible_score, normalized_score, percentage, risk_level, breakdown, suggestions }
 */
const score = async (payload) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/score`, payload, {
      timeout: 10000, // 10 second timeout
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (err) {
    if (err.response) {
      const msg = err.response.data?.detail || 'Scoring service error';
      throw new Error(`FastAPI error: ${msg}`);
    }
    throw new Error(`Cannot reach scoring service at ${FASTAPI_URL}. Is the Python service running?`);
  }
};

/**
 * Call the FastAPI trends endpoint with daily check-in logs
 * Returns: { trends, pattern_alerts, averages }
 */
const getTrends = async (logs) => {
  try {
    const response = await axios.post(`${FASTAPI_URL}/trends`, { logs }, { timeout: 10000 });
    return response.data;
  } catch (err) {
    // Trends are non-critical — return null instead of throwing
    console.warn('[scoringProxy] Trends service unavailable:', err.message);
    return null;
  }
};

module.exports = { score, getTrends };
