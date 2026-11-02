// customer-feedback-analyzer
// web/public/js/dashboard.js
// Handles dashboard data fetching, KPI calculations, Chart.js visualizations, and recent feedback streams.

import { getDashboardData } from './api.js';

let sentimentChart = null;
let categoryChart = null;
let dailyChart = null;
let refreshTimer = null;

const AUTO_REFRESH_INTERVAL_MS = 60000;

document.addEventListener('DOMContentLoaded', () => {
  // Auth Elements
  const authGate = document.getElementById('admin-auth-gate');
  const mainView = document.getElementById('dashboard-main-view');
  const authForm = document.getElementById('admin-auth-form');
  const passwordInput = document.getElementById('admin-password-input');
  const authError = document.getElementById('admin-auth-error');
  const lockBtn = document.getElementById('lock-dashboard-btn');

  const rangeSelector = document.getElementById('range-selector');
  const refreshBtn = document.getElementById('refresh-btn');
  const refreshIcon = document.getElementById('refresh-icon');
  const retryBtn = document.getElementById('retry-btn');
  const lastUpdatedText = document.getElementById('last-updated-text');

  const loadingEl = document.getElementById('dashboard-loading');
  const errorEl = document.getElementById('dashboard-error');
  const errorMsgEl = document.getElementById('dashboard-error-msg');
  const emptyEl = document.getElementById('dashboard-empty');
  const contentEl = document.getElementById('dashboard-content');

  // KPI elements
  const kpiTotal = document.getElementById('kpi-total');
  const kpiIssues = document.getElementById('kpi-issues');
  const kpiIssuesSub = document.getElementById('kpi-issues-sub');
  const kpiAngry = document.getElementById('kpi-angry');
  const kpiSentiment = document.getElementById('kpi-sentiment');
  const kpiSentimentLabel = document.getElementById('kpi-sentiment-label');

  // Containers
  const topIssuesContainer = document.getElementById('top-issues-container');
  const recentTableBody = document.getElementById('recent-table-body');
  const recentCardsMobile = document.getElementById('recent-cards-mobile');
  const recentCountBadge = document.getElementById('recent-count-badge');

  async function loadData() {
    showLoading();
    refreshIcon?.classList.add('animate-spin');

    try {
      const days = rangeSelector.value;
      const data = await getDashboardData({ days });

      if (!data || !data.totals || data.totals.feedback === 0) {
        showEmpty();
      } else {
        renderDashboard(data);
        showContent();
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      lastUpdatedText.textContent = `• Updated at ${timeStr}`;
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      showError(err.message || 'Error communicating with analytics API');
    } finally {
      refreshIcon?.classList.remove('animate-spin');
    }
  }

  function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    emptyEl.classList.add('hidden');
    contentEl.classList.add('hidden');
  }

  function showError(msg) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    contentEl.classList.add('hidden');
    if (errorMsgEl) errorMsgEl.textContent = msg;
  }

  function showEmpty() {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
  }

  function showContent() {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    emptyEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  }

  function renderDashboard(data) {
    const { totals, by_sentiment, by_source, daily, top_issues, recent } = data;

    // 1. Update KPIs
    kpiTotal.textContent = totals.feedback.toLocaleString();
    const issueCount = (totals.complaints || 0) + (totals.bugs || 0);
    kpiIssues.textContent = issueCount.toLocaleString();
    kpiIssuesSub.textContent = `${totals.complaints || 0} complaints, ${totals.bugs || 0} bugs`;
    kpiAngry.textContent = (totals.angry || 0).toLocaleString();

    const score = Number(totals.avg_score) || 0;
    kpiSentiment.textContent = (score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2));
    if (score >= 0.15) {
      kpiSentiment.className = 'mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600';
      kpiSentimentLabel.textContent = 'Positive Experience';
      kpiSentimentLabel.className = 'mt-1 text-xs font-semibold text-emerald-600';
    } else if (score <= -0.15) {
      kpiSentiment.className = 'mt-2 text-2xl sm:text-3xl font-extrabold text-red-600';
      kpiSentimentLabel.textContent = 'Negative Experience';
      kpiSentimentLabel.className = 'mt-1 text-xs font-semibold text-red-600';
    } else {
      kpiSentiment.className = 'mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600';
      kpiSentimentLabel.textContent = 'Neutral Experience';
      kpiSentimentLabel.className = 'mt-1 text-xs font-semibold text-amber-600';
    }

    // 2. Render Charts
    renderSentimentChart(by_sentiment);
    renderCategoryChart(totals);
    renderDailyChart(daily);

    // 3. Render Top Issues
    renderTopIssues(top_issues, totals.feedback);

    // 4. Render Recent Feedback
    renderRecentFeedback(recent || []);
  }

  function renderSentimentChart(bySentiment) {
    const ctx = document.getElementById('chart-sentiment')?.getContext('2d');
    if (!ctx) return;

    const positive = bySentiment?.positive || 0;
    const neutral = bySentiment?.neutral || 0;
    const negative = bySentiment?.negative || 0;

    if (sentimentChart) sentimentChart.destroy();

    sentimentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [positive, neutral, negative],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 14, font: { size: 12 } }
          }
        },
        cutout: '65%'
      }
    });
  }

  function renderCategoryChart(totals) {
    const ctx = document.getElementById('chart-category')?.getContext('2d');
    if (!ctx) return;

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Praise', 'Complaints', 'Bugs', 'Ideas'],
        datasets: [{
          data: [
            totals?.praise || 0,
            totals?.complaints || 0,
            totals?.bugs || 0,
            totals?.ideas || 0
          ],
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderDailyChart(daily) {
    const ctx = document.getElementById('chart-daily')?.getContext('2d');
    if (!ctx) return;

    if (dailyChart) dailyChart.destroy();

    const labels = (daily || []).map(d => {
      const parts = d.date.split('-');
      return `${parts[1]}/${parts[2]}`;
    });
    const counts = (daily || []).map(d => d.count);

    dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Feedback Entries',
          data: counts,
          borderColor: '#059669',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 11 } },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  function renderTopIssues(topIssues, totalFeedback) {
    topIssuesContainer.innerHTML = '';

    if (!topIssues || topIssues.length === 0) {
      topIssuesContainer.innerHTML = `
        <div class="text-center py-6 text-sm text-slate-500">
          No repeated issues identified in this period.
        </div>
      `;
      return;
    }

    const maxCount = Math.max(...topIssues.map(i => i.count), 1);

    topIssues.forEach((issue, idx) => {
      const pct = Math.round((issue.count / maxCount) * 100);
      const rowEl = document.createElement('div');
      rowEl.className = 'flex flex-col gap-1.5';

      rowEl.innerHTML = `
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <span class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              ${idx + 1}
            </span>
            <span class="font-semibold text-slate-800 capitalize">${escapeHtml(issue.issue_group)}</span>
            ${issue.angry_count > 0 ? `<span class="badge bg-red-100 text-red-700">🚨 ${issue.angry_count} angry</span>` : ''}
          </div>
          <span class="font-mono text-xs font-bold text-slate-600">${issue.count} mention${issue.count > 1 ? 's' : ''}</span>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div class="h-full rounded-full ${issue.angry_count > 0 ? 'bg-red-500' : 'bg-emerald-500'}" style="width: ${pct}%"></div>
        </div>
      `;

      topIssuesContainer.appendChild(rowEl);
    });
  }

  function renderRecentFeedback(recent) {
    recentCountBadge.textContent = `${recent.length} item${recent.length === 1 ? '' : 's'}`;
    recentTableBody.innerHTML = '';
    recentCardsMobile.innerHTML = '';

    if (recent.length === 0) {
      recentTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-sm text-slate-500">No recent feedback entries found.</td></tr>`;
      recentCardsMobile.innerHTML = `<div class="text-center py-6 text-sm text-slate-500">No recent feedback entries found.</div>`;
      return;
    }

    recent.forEach(item => {
      const dateStr = item.received_at ? new Date(item.received_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
      const categoryBadge = getCategoryBadge(item.category);
      const sourceBadge = getSourceBadge(item.source);
      const sentimentDot = getSentimentDot(item.sentiment, item.is_angry);
      const commentText = item.comment || '';
      const isLong = commentText.length > 90;
      const shortComment = isLong ? commentText.slice(0, 90) + '...' : commentText;

      // Desktop row
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/60 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-3 text-xs text-slate-500 whitespace-nowrap">${dateStr}</td>
        <td class="py-3 px-3 whitespace-nowrap">${sourceBadge}</td>
        <td class="py-3 px-3 whitespace-nowrap">${categoryBadge}</td>
        <td class="py-3 px-3 whitespace-nowrap">${sentimentDot}</td>
        <td class="py-3 px-3 text-xs font-medium text-slate-700 capitalize whitespace-nowrap">${escapeHtml(item.issue_group || '—')}</td>
        <td class="py-3 px-3 text-xs text-slate-600 max-w-xs break-words">
          <span class="comment-short">${escapeHtml(shortComment)}</span>
          ${isLong ? `<span class="comment-full hidden">${escapeHtml(commentText)}</span> <button type="button" class="expand-btn text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline ml-1">More</button>` : ''}
        </td>
      `;
      recentTableBody.appendChild(tr);

      // Mobile card
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs space-y-2';
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">${sourceBadge} ${categoryBadge}</div>
          <span class="text-xs text-slate-400">${dateStr}</span>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-slate-700 capitalize">${escapeHtml(item.issue_group || 'Untriaged')}</span>
          ${sentimentDot}
        </div>
        <p class="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
          <span class="comment-short">${escapeHtml(shortComment)}</span>
          ${isLong ? `<span class="comment-full hidden">${escapeHtml(commentText)}</span> <button type="button" class="expand-btn text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline ml-1">More</button>` : ''}
        </p>
      `;
      recentCardsMobile.appendChild(card);
    });

    // Attach expandable toggle handlers
    document.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const parent = btn.parentElement;
        const shortEl = parent.querySelector('.comment-short');
        const fullEl = parent.querySelector('.comment-full');
        if (fullEl.classList.contains('hidden')) {
          fullEl.classList.remove('hidden');
          shortEl.classList.add('hidden');
          btn.textContent = 'Less';
        } else {
          fullEl.classList.add('hidden');
          shortEl.classList.remove('hidden');
          btn.textContent = 'More';
        }
      });
    });
  }

  function getCategoryBadge(cat) {
    switch (cat) {
      case 'praise':
        return `<span class="badge bg-emerald-100 text-emerald-800">Praise</span>`;
      case 'complaint':
        return `<span class="badge bg-red-100 text-red-800">Complaint</span>`;
      case 'bug':
        return `<span class="badge bg-amber-100 text-amber-800">Bug</span>`;
      case 'idea':
        return `<span class="badge bg-blue-100 text-blue-800">Idea</span>`;
      default:
        return `<span class="badge bg-slate-100 text-slate-700">${escapeHtml(cat || 'Review')}</span>`;
    }
  }

  function getSourceBadge(source) {
    switch (source) {
      case 'survey':
        return `<span class="badge bg-purple-50 text-purple-700 border border-purple-200">Survey</span>`;
      case 'email':
        return `<span class="badge bg-sky-50 text-sky-700 border border-sky-200">Email</span>`;
      case 'google_review':
        return `<span class="badge bg-amber-50 text-amber-700 border border-amber-200">Google</span>`;
      default:
        return `<span class="badge bg-slate-50 text-slate-600 border border-slate-200">${escapeHtml(source || 'Web')}</span>`;
    }
  }

  function getSentimentDot(sentiment, isAngry) {
    if (isAngry) {
      return `<span class="inline-flex items-center gap-1 text-xs font-bold text-red-600"><span class="h-2 w-2 rounded-full bg-red-600"></span>Angry</span>`;
    }
    switch (sentiment) {
      case 'positive':
        return `<span class="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Positive</span>`;
      case 'negative':
        return `<span class="inline-flex items-center gap-1 text-xs font-medium text-red-600"><span class="h-2 w-2 rounded-full bg-red-500"></span>Negative</span>`;
      default:
        return `<span class="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><span class="h-2 w-2 rounded-full bg-amber-500"></span>Neutral</span>`;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Event Listeners
  rangeSelector.addEventListener('change', () => loadData());
  refreshBtn.addEventListener('click', () => loadData());
  retryBtn.addEventListener('click', () => loadData());

  // Auto-refresh every 60s when active
  function resetAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && isAuthorized()) {
        loadData();
      }
    }, AUTO_REFRESH_INTERVAL_MS);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isAuthorized()) {
      loadData();
      resetAutoRefresh();
    }
  });

  // Authentication Helpers
  function isAuthorized() {
    return sessionStorage.getItem('chopfast_admin_auth') === 'true';
  }

  function unlockDashboard() {
    authGate?.classList.add('hidden');
    mainView?.classList.remove('hidden');
    loadData();
    resetAutoRefresh();
  }

  function lockDashboard() {
    sessionStorage.removeItem('chopfast_admin_auth');
    if (refreshTimer) clearInterval(refreshTimer);
    mainView?.classList.add('hidden');
    authGate?.classList.remove('hidden');
    if (passwordInput) {
      passwordInput.value = '';
    }
  }

  authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    authError?.classList.add('hidden');
    const entered = (passwordInput?.value || '').trim();
    const expected = (window.APP_CONFIG && window.APP_CONFIG.ADMIN_PASSWORD) || 'chopfast2026';

    if (entered === expected) {
      sessionStorage.setItem('chopfast_admin_auth', 'true');
      unlockDashboard();
    } else {
      authError?.classList.remove('hidden');
      passwordInput?.select();
    }
  });

  lockBtn?.addEventListener('click', () => {
    lockDashboard();
  });

  // Initial Authentication Check
  if (isAuthorized()) {
    unlockDashboard();
  } else {
    lockDashboard();
  }
});
