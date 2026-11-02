# Google Sheet Structure: "ChopFast Feedback Analyzer"

This document defines the exact layout and column requirements for the Google Sheet used by the Customer Feedback Analyzer.

---

## Tab 1: `Feedback`

This sheet stores all incoming and AI-analyzed customer comments from web surveys, emails, Google reviews, and test runs.

### One-line Header String (Copy & Paste into Row 1):
```text
id	received_at	source	source_ref	customer_name	customer_email	rating	comment	category	sentiment	sentiment_score	is_angry	issue_group	summary	alert_sent	batch_id
```
*(Note: Tab-separated. When pasted into cell A1, Google Sheets automatically splits them into separate columns.)*

### Columns Detail:

| Column | Name | Type | Description |
|---|---|---|---|
| A | `id` | text | Unique ID (`fb_` + base36 timestamp + random suffix) |
| B | `received_at` | ISO 8601 | Timestamp when n8n received the feedback |
| C | `source` | enum | Intake channel: `survey`, `email`, `google_review`, `test` |
| D | `source_ref` | text | Reference ID (Gmail message ID or Google review name) |
| E | `customer_name` | text | Customer's full or display name (optional) |
| F | `customer_email` | text | Customer's email address (optional) |
| G | `rating` | number | Customer rating (1 to 5, optional) |
| H | `comment` | text | The raw feedback text |
| I | `category` | enum | Classified category: `praise`, `complaint`, `bug`, `idea` |
| J | `sentiment` | enum | Sentiment label: `positive`, `neutral`, `negative` |
| K | `sentiment_score` | number | Numeric sentiment score from -1.0 to 1.0 |
| L | `is_angry` | boolean | `TRUE` if extreme anger/frustration detected, otherwise `FALSE` |
| M | `issue_group` | text | Normalized 2–4 word noun phrase grouping repeated complaints |
| N | `summary` | text | Brief summary of the feedback (15 words or fewer) |
| O | `alert_sent` | boolean | `TRUE` if an urgent Telegram notification was dispatched |
| P | `batch_id` | text | Identifier for automated test runs (empty for live feedback) |

---

## Tab 2: `Digests`

This sheet logs every weekly digest execution, including automated scheduled runs and manual test runs.

### One-line Header String (Copy & Paste into Row 1):
```text
run_at	period_start	period_end	batch_id	total_feedback	top_issues_json	recipient
```

### Columns Detail:

| Column | Name | Type | Description |
|---|---|---|---|
| A | `run_at` | ISO 8601 | Timestamp when digest ran |
| B | `period_start` | ISO 8601 | Start of evaluation window |
| C | `period_end` | ISO 8601 | End of evaluation window |
| D | `batch_id` | text | Test batch ID if run in test mode |
| E | `total_feedback`| number | Total comments analyzed in window |
| F | `top_issues_json`| text (JSON) | JSON array of the top 5 ranked issues and metrics |
| G | `recipient` | text | Email address that received the digest |
