// customer-feedback-analyzer
// web/public/js/api.js
// API client for submitting feedback and retrieving dashboard analytics.

const DEFAULT_TIMEOUT_MS = 30000;

function getBaseUrl() {
  const base = window.APP_CONFIG?.N8N_BASE_URL || 'http://localhost:5678';
  return base.replace(/\/+$/, '');
}

/**
 * Sends a feedback submission payload to CFA 01 webhook.
 * @param {Object} payload - { source, customer_name, customer_email, rating, comment, website }
 * @returns {Promise<Object>}
 */
export async function postFeedback(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = `${getBaseUrl()}/webhook/feedback`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (!response.ok) {
      const msg = data.error || data.message || `Server responded with status ${response.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection or server status.');
    }
    throw err;
  }
}

/**
 * Retrieves aggregate metrics and recent feedback from CFA 05 webhook.
 * @param {Object} [options] - { days: number|string, batchId: string }
 * @returns {Promise<Object>}
 */
export async function getDashboardData({ days = 7, batchId = '' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const params = new URLSearchParams();
    if (days !== undefined && days !== null) params.set('days', String(days));
    if (batchId) params.set('batch_id', batchId);

    const url = `${getBaseUrl()}/webhook/dashboard-data?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    if (!response.ok) {
      const msg = data.error || data.message || `Failed to fetch metrics (HTTP ${response.status})`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Dashboard request timed out. Please verify that n8n is running.');
    }
    throw err;
  }
}
