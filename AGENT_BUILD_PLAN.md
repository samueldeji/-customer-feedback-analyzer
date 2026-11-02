# Customer Feedback Analyzer — Agent Build Plan

**Project:** SIWES project, Department of Computer Science, Obafemi Awolowo University
**Developer machine:** Windows laptop (Dell XPS 13), PowerShell, VS Code
**Builder:** an AI coding agent with PowerShell access, working with a human student

---

## 0. How to use this document (read first, agent)

You are the build agent for this project. Follow these rules for the entire build:

1. **Work phase by phase, in order.** Do not start a phase until the previous phase's checkpoint passes.
2. **Stop at every `[HUMAN TASK]`.** These are things only the human can do: signing in to Google, clicking OAuth consent screens, entering the BIOS, creating accounts, copying secrets. Print clear step-by-step instructions for the human, then wait for them to confirm before continuing.
3. **Use ONLY the approved stack (Section 2).** Do not add React, Vue, Express, databases, Python, Prettier, ESLint, bundlers, UI kits, or any npm package not listed. If you believe something extra is needed, stop and ask the human first.
4. **Never write secrets into committed files.** Secrets live only in `.env` (git-ignored) and in n8n's credential store. Never print API keys or tokens back into the terminal output.
5. **Verify before you claim.** After every step, run the check listed for it. If a check fails, fix it before moving on. Never say something works without having run it.
6. **Windows-first commands.** All shell commands are PowerShell. Use forward slashes or `Join-Path` in scripts so the code also runs on macOS and Linux.
7. **Clean code standards:** consistent 2-space indentation, UTF-8, LF line endings, descriptive names, a short header comment at the top of every file explaining its purpose, no dead code, no commented-out code, no `console.log` debugging left behind (except intentional CLI output in `scripts/`).
8. **Commit after each phase** with a clear message, e.g. `feat(n8n): add feedback processor workflow`.
9. **Do not guess n8n node formats.** Section 6.1 explains how to read the exact node parameter formats from the installed n8n package. Always do this before writing workflow JSON.
10. **Explain as you go.** The human is a student learning on the job. After each phase, print a 3–5 line plain-English summary of what was built and why, which they can reuse in their SIWES report.

---

## 1. What we are building

An n8n-based system that turns unread customer feedback into clear action for any business.

**Required features (from the project brief):**
- Triggers from **survey forms**, **Google reviews** and **emails**
- AI tags every comment with a **category** (praise, complaint, bug, idea) and a **sentiment**
- A **Google Sheet** containing all tagged feedback
- An **instant alert** for angry customers
- **Repeated complaints grouped together**
- A **weekly digest of the top 5 issues**
- A **responsive web app** (feedback form + dashboard) that works on iOS, Android, macOS, Linux and Windows browsers

**Definition of done:** 50 fake comments produce one weekly digest with the correct top 5 issues (Phase 8).

**Demo business (fictional):** "ChopFast", a food delivery app in Lagos. All test data and copy use this brand. It is fictional; do not use any real company name or logo.

---

## 2. Approved stack (use nothing else)

| Layer | Tool | Notes |
|---|---|---|
| Automation engine | **n8n** (self-hosted) | Docker if virtualization works, otherwise `npm install -g n8n` (Phase 1 decides) |
| AI tagging + digest summary | **Google Gemini API** (REST, via n8n HTTP Request node) | Free tier key from Google AI Studio |
| Storage | **Google Sheets** | Via the n8n Google Sheets node (OAuth2) |
| Survey trigger | **Our web form** → n8n Webhook | |
| Email trigger | **Gmail Trigger** node | |
| Google reviews | **Google Places API (New)** via HTTP Request, plus a review simulator in the test data | Places needs a Google Cloud billing account; if the human has none, the poller stays disabled and the simulator is used |
| Instant alerts | **Telegram Bot** via n8n Telegram node | |
| Weekly digest | n8n **Schedule Trigger** + **Gmail** node | |
| Front-end | **HTML + Tailwind CSS v4 (CLI) + vanilla JavaScript + Chart.js** (CDN) | No frameworks |
| Hosting | **Netlify** (web app), **Cloudflare Tunnel** `cloudflared` (exposes local n8n) | |
| Version control | **Git + GitHub** | |
| Editor | **VS Code** | |
| Scripts | **Node.js** (already installed, v24) using only built-in modules | Use `node --env-file=.env` instead of the dotenv package |

**Allowed npm packages (complete list):** `n8n` (global, only if not using Docker), `tailwindcss` and `@tailwindcss/cli` (dev dependencies in `web/`). Nothing else.

---

## 3. Final folder structure

Create exactly this structure. Do not add top-level folders that are not listed.

```
customer-feedback-analyzer/
├── AGENT_BUILD_PLAN.md          # this file
├── README.md                    # project overview + setup + run guide
├── .gitignore
├── .editorconfig
├── .env.example                 # all config keys, no values
├── package.json                 # root scripts only, no dependencies
├── .vscode/
│   ├── extensions.json          # recommends Tailwind CSS IntelliSense
│   └── settings.json            # format on save off, 2-space tabs, LF
├── docs/
│   ├── architecture.md          # diagram (Mermaid) + explanation of each workflow
│   ├── setup-google.md          # Google Cloud, OAuth, Gemini key, Sheet setup
│   ├── setup-telegram.md        # BotFather + chat ID
│   ├── sheet-structure.md       # tabs and columns
│   └── test-report.md           # filled in after Phase 8
├── n8n/
│   ├── workflows/               # committed templates with __PLACEHOLDERS__
│   │   ├── 01-feedback-processor.template.json
│   │   ├── 02-gmail-intake.template.json
│   │   ├── 03-google-reviews-intake.template.json
│   │   ├── 04-weekly-digest.template.json
│   │   └── 05-dashboard-api.template.json
│   └── dist/                    # generated, git-ignored
├── scripts/
│   ├── build-workflows.js       # fills placeholders from .env → n8n/dist
│   ├── import-workflows.ps1     # imports n8n/dist into n8n (Docker or npm mode)
│   ├── send-test-feedback.js    # posts the 50 test comments one by one
│   ├── verify-digest.js         # runs the digest for the test batch and checks it
│   └── serve-web.js             # tiny static server for local web testing (node:http)
├── test-data/
│   └── feedback-50.json         # 50 fake comments with expected labels
└── web/
    ├── package.json             # tailwind build scripts
    ├── netlify.toml
    ├── src/
    │   └── input.css            # Tailwind entry + small custom layer
    └── public/
        ├── index.html           # landing page
        ├── feedback.html        # survey form (trigger)
        ├── dashboard.html       # analytics dashboard
        ├── css/styles.css       # generated by Tailwind (git-ignored)
        ├── js/config.js         # N8N_BASE_URL only
        ├── js/api.js            # shared fetch helpers
        ├── js/feedback.js
        ├── js/dashboard.js
        └── img/favicon.svg      # simple original icon
```

`.gitignore` must include: `node_modules/`, `.env`, `n8n/dist/`, `web/public/css/styles.css`, `.DS_Store`, `Thumbs.db`, `*.log`.

---

## 4. Configuration (`.env.example`)

```
# n8n
N8N_BASE_URL=http://localhost:5678
N8N_MODE=                      # "docker" or "npm" (set in Phase 1)

# Google Sheets
GOOGLE_SHEET_ID=
SHEET_TAB_FEEDBACK=Feedback
SHEET_TAB_DIGESTS=Digests

# Gemini
GEMINI_MODEL=                  # verified in Phase 2 against the live model list

# Alerts and digest
TELEGRAM_CHAT_ID=
DIGEST_RECIPIENT_EMAIL=
ANGRY_SCORE_THRESHOLD=-0.6

# Gmail intake
GMAIL_FEEDBACK_QUERY=label:feedback

# Google reviews (optional; leave blank if no billing account)
GOOGLE_PLACE_ID=

# n8n credential IDs (copied from the n8n UI in Phase 3)
CRED_GOOGLE_SHEETS_ID=
CRED_GMAIL_ID=
CRED_TELEGRAM_ID=
CRED_GEMINI_HEADER_ID=
CRED_PLACES_HEADER_ID=

# Testing
TEST_DELAY_MS=6000
```

`scripts/build-workflows.js` replaces `__KEY__` placeholders in each template with the matching `.env` value and writes the result to `n8n/dist/`. It must **fail loudly** with the list of missing keys if any required key is empty (Places keys are optional).

---

## 5. Data design

### 5.1 Google Sheet: "ChopFast Feedback Analyzer"

**Tab `Feedback`** (row 1 = headers, exactly these, in this order):

| Column | Type | Meaning |
|---|---|---|
| id | text | `fb_` + base36 timestamp + random suffix |
| received_at | ISO 8601 | when n8n received it |
| source | enum | `survey`, `email`, `google_review`, `test` |
| source_ref | text | Gmail message ID or Google review name (for de-duplication) |
| customer_name | text | optional |
| customer_email | text | optional |
| rating | number 1–5 | optional |
| comment | text | the feedback |
| category | enum | `praise`, `complaint`, `bug`, `idea` |
| sentiment | enum | `positive`, `neutral`, `negative` |
| sentiment_score | number −1 to 1 | |
| is_angry | TRUE/FALSE | |
| issue_group | text | grouped issue label; empty for praise |
| summary | text | ≤ 15 words |
| alert_sent | TRUE/FALSE | |
| batch_id | text | used by tests; empty for real feedback |

**Tab `Digests`:** `run_at`, `period_start`, `period_end`, `batch_id`, `total_feedback`, `top_issues_json`, `recipient`.

Document this in `docs/sheet-structure.md`, including a one-line header string the human can paste into row 1 of each tab.

### 5.2 Standard feedback payload (all sources use this)

`POST {N8N_BASE_URL}/webhook/feedback` with JSON:

```json
{
  "source": "survey",
  "source_ref": "",
  "customer_name": "Ada",
  "customer_email": "ada@example.com",
  "rating": 2,
  "comment": "My food arrived 90 minutes late and cold.",
  "batch_id": "",
  "website": ""
}
```

- `comment` is required and must be 3–2000 characters after trimming.
- `website` is a honeypot field. If it is non-empty, return 200 but do nothing (spam).
- `rating` is optional; if present it must be an integer from 1 to 5.

**Success response (200):** `{ "ok": true, "id", "category", "sentiment", "sentiment_score", "is_angry", "issue_group" }`
**Validation error (400):** `{ "ok": false, "error": "<human-readable message>" }`

---

## 6. n8n rules the agent must follow

### 6.1 Get node formats from the installed package (mandatory)

Before writing any workflow JSON:
1. Run `n8n --version` (npm mode) or `docker exec n8n n8n --version` (Docker mode) and record the version in `docs/architecture.md`.
2. Find the node definitions folder:
   - npm mode: `Join-Path (npm root -g) "n8n/node_modules/n8n-nodes-base/dist/nodes"`
   - Docker mode: `docker exec n8n sh -c "ls /usr/local/lib/node_modules/n8n/node_modules/n8n-nodes-base/dist/nodes"`
3. For every node type you use, read its description files to confirm the **latest `typeVersion`**, exact **parameter names**, and **credential type names**. Nodes used:
   `n8n-nodes-base.webhook`, `n8n-nodes-base.respondToWebhook`, `n8n-nodes-base.code`, `n8n-nodes-base.if`, `n8n-nodes-base.httpRequest`, `n8n-nodes-base.googleSheets`, `n8n-nodes-base.gmail`, `n8n-nodes-base.gmailTrigger`, `n8n-nodes-base.telegram`, `n8n-nodes-base.scheduleTrigger`, `n8n-nodes-base.splitOut` (optional).
4. Expected credential type names (confirm them): `googleSheetsOAuth2Api`, `gmailOAuth2`, `telegramApi`, `httpHeaderAuth`.
5. **Smoke test:** write the smallest workflow (Webhook → Respond to Webhook), import it, ask the human to activate it, call it with `Invoke-RestMethod`, then delete it. This proves the JSON format and the import command before you build the real workflows.

### 6.2 Workflow JSON conventions

- Every node has: `id` (a UUID you generate), `name` (unique, descriptive, Title Case, e.g. `Validate Input`), `type`, `typeVersion`, `position` (laid out left to right, 220 px apart), `parameters`.
- `connections` are keyed by node **name**.
- Credentials are referenced as `"credentials": { "<credType>": { "id": "__CRED_X_ID__", "name": "<display name>" } }`.
- Add a **Sticky Note** node at the top-left of each workflow explaining in 3–5 lines what it does (good for screenshots in the SIWES report).
- Workflow names: `CFA 01 – Feedback Processor`, `CFA 02 – Gmail Intake`, and so on.
- Set the workflow timezone setting to `Africa/Lagos`.

### 6.3 Known n8n behaviours to handle

- **Empty results stop the flow.** A Google Sheets read on an empty sheet returns 0 items, and downstream nodes then don't run. Enable **Always Output Data** on every Sheets read node, and make the next Code node handle an empty or placeholder item.
- **Item replacement.** After a Sheets read, the original webhook data is no longer the current item. Reference it explicitly: `$('Validate Input').first().json`.
- **Webhook URLs.** `/webhook-test/...` works only while the editor is listening; `/webhook/...` works only when the workflow is active. All scripts and the web app use `/webhook/...`.
- **Retries.** On Gemini HTTP nodes, set `retryOnFail: true`, `maxTries: 3`, `waitBetweenTries: 5000`.
- **CORS.** On webhooks called by the browser (`feedback`, `dashboard-data`), set the webhook's allowed-origins option to `*` (confirm the option name in 6.1). Also add the response header `Access-Control-Allow-Origin: *` on their Respond to Webhook nodes. Verify the browser preflight with:
  `Invoke-WebRequest -Method Options -Uri "$env:N8N_BASE_URL/webhook/feedback" -Headers @{ "Origin"="http://localhost:8080"; "Access-Control-Request-Method"="POST"; "Access-Control-Request-Headers"="content-type" }`
  If the preflight fails on this n8n version, switch the front-end to send `Content-Type: text/plain;charset=UTF-8` (no preflight needed). `Validate Input` already accepts a string body (see WF1).
- **Code nodes:** JavaScript only, no `require`. Generate IDs with `Date.now().toString(36)` + `Math.random().toString(36).slice(2, 8)`.
- **Secrets:** Gemini and Places keys live only in n8n **Header Auth** credentials, never in workflow JSON.

---

## 7. Workflow specifications

### WF1 — `CFA 01 – Feedback Processor` (the core)

**Trigger:** Webhook `POST /feedback`, response mode = "Using Respond to Webhook node".

**Nodes, in order:**
1. **Feedback Webhook** — receives the payload.
2. **Validate Input** (Code)
   - If the body is a string, `JSON.parse` it.
   - Trim all strings. Validate `comment` length, `rating` range, and `source` enum (default `survey`).
   - Honeypot check on `website`.
   - Output `{ valid, spam, error, data: { id, received_at, source, source_ref, customer_name, customer_email, rating, comment, batch_id } }`.
3. **Is Valid?** (IF)
   - False → **Respond 400** with `{ ok:false, error }`.
   - Spam → **Respond 200** `{ ok:true }` and stop.
4. **Read Existing Groups** (Google Sheets, get rows from `Feedback`, Always Output Data on).
5. **Build Gemini Request** (Code)
   - Collect the distinct non-empty `issue_group` values.
   - Build the Gemini request body from Section 7.1.
6. **Tag With Gemini** (HTTP Request)
   - `POST https://generativelanguage.googleapis.com/v1beta/models/__GEMINI_MODEL__:generateContent`
   - Header Auth credential with header name `x-goog-api-key`. Retries on.
7. **Parse Tags** (Code)
   - Read `candidates[0].content.parts[0].text` and `JSON.parse` it.
   - Enforce enums (an invalid category falls back to `complaint` if score < 0, else `praise`) and clamp the score to [−1, 1].
   - **Normalize `issue_group`:** lowercase, trim, collapse spaces, strip punctuation.
   - **Fuzzy reuse:** compare the word set with each existing group. If Jaccard similarity ≥ 0.5, use the existing group instead.
   - Praise always gets an empty `issue_group`.
   - `is_angry = ai.is_angry === true || sentiment_score <= ANGRY_SCORE_THRESHOLD`.
   - If Gemini failed after retries: category from rating (≥4 praise, ≤2 complaint, else idea), sentiment from rating, `issue_group` = `"untriaged"`, and `summary` notes the failure. The row is still saved, so no feedback is ever lost.
8. **Save To Sheet** (Google Sheets, append row to `Feedback`). Set `alert_sent` to the value of `is_angry`.
9. **Respond 200** with the success JSON.
10. **Is Angry?** (IF, after the response)
    - True → **Send Telegram Alert** (Telegram node, chat `__TELEGRAM_CHAT_ID__`, parse mode HTML, escape `<`, `>` and `&`).

Message format:
```
🚨 Angry customer alert
Source: <source>
Customer: <name or "Anonymous"> <email>
Rating: <rating or "n/a">  Score: <score>
Issue: <issue_group>
"<comment, max 500 chars>"
```

### 7.1 Gemini tagging request (use exactly this design)

`generationConfig`:
- `temperature: 0.1`
- `responseMimeType: "application/json"`
- `responseSchema`: object with required properties:
  - `category` (STRING, enum praise|complaint|bug|idea)
  - `sentiment` (STRING, enum positive|neutral|negative)
  - `sentiment_score` (NUMBER)
  - `is_angry` (BOOLEAN)
  - `issue_group` (STRING)
  - `summary` (STRING)

Prompt text (in `contents[0].parts[0].text`):

```
You are a customer feedback analyst for a business. Classify ONE customer comment.

Rules:
- category: exactly one of
  - "bug": a technical malfunction of the app or website (crash, freeze, error message, broken button, payment page failing).
  - "complaint": dissatisfaction with service, delivery, staff, price, food or product quality.
  - "idea": a suggestion or feature request.
  - "praise": positive feedback with no problem reported.
- sentiment: "positive", "neutral" or "negative".
- sentiment_score: a number from -1 (very negative) to 1 (very positive).
- is_angry: true ONLY for strong anger: insults, threats to leave, report or sue, words like "furious", "worst", "scam", "disgusting", heavy use of capitals or "!!!". Mild disappointment is NOT angry.
- issue_group: for complaint, bug and idea, a short lowercase noun phrase of 2 to 4 words naming the UNDERLYING problem in generic terms (good: "slow delivery"; bad: "order 4451 was late on friday").
  You MUST reuse a group from EXISTING GROUPS when the comment describes the same underlying problem, even if worded differently.
  Create a new group only when none fits. For praise, use "".
- summary: at most 15 words, neutral tone.

EXISTING GROUPS: <JSON array of existing groups, or [] if none>
CUSTOMER RATING (1-5, may be empty): <rating>
COMMENT:
"""<comment>"""
```

### WF2 — `CFA 02 – Gmail Intake`

**Flow:** **Gmail Trigger** (poll every minute, filters/query `__GMAIL_FEEDBACK_QUERY__`) → **Normalize Email** (Code) → **Send To Processor** (HTTP POST to `http://localhost:5678/webhook/feedback`).

**Normalize Email** builds:
- `source: "email"` and `source_ref` = message ID
- `customer_name` and `customer_email` from the From header
- `comment` = subject + " — " + plain-text body, with quoted replies (lines starting with `>` and everything after "On … wrote:") and signatures after `-- ` stripped, then trimmed to 2000 characters

### WF3 — `CFA 03 – Google Reviews Intake` (import it **inactive**)

**Flow:**
1. **Schedule Trigger** every 6 hours.
2. **Fetch Reviews** (HTTP GET `https://places.googleapis.com/v1/places/__GOOGLE_PLACE_ID__`)
   - Header Auth credential with header `X-Goog-Api-Key`
   - Header `X-Goog-FieldMask: reviews`
3. **Split Reviews** (Code: one item per review; `source_ref` = review `name`, `rating`, `comment` = `text.text`, `customer_name` = `authorAttribution.displayName`).
4. **Read Known Reviews** (Sheets, Always Output Data).
5. **Keep New Only** (Code: drop reviews whose `source_ref` already exists).
6. **Send To Processor** (HTTP POST with `source: "google_review"`).

Explain in `docs/setup-google.md` that Places API (New) requires billing on the Google Cloud project and returns at most about 5 recent reviews. Without billing, Google-review traffic comes from the test data (`source: "google_review"` items), and that's acceptable for the project.

### WF4 — `CFA 04 – Weekly Digest`

**Triggers (two):**
- **Schedule Trigger:** every Monday 08:00 (workflow timezone Africa/Lagos)
- **Digest Webhook:** `GET /digest-run?batch_id=&days=7&send=true` (for testing)

**Nodes:**
1. **Read All Feedback** (Sheets, Always Output Data).
2. **Rank Top Issues** (Code). The ranking is computed in code, NOT by AI, so it is deterministic.
   - Window: the last `days` (default 7) by `received_at`. If `batch_id` is given, filter to that batch only.
   - Only `category` in {complaint, bug} with a non-empty `issue_group` other than "untriaged".
   - Group by `issue_group`, count, sort by count desc, then by average sentiment score asc, then by name.
   - Keep the top 5. For each: `rank`, `issue_group`, `count`, `angry_count`, `avg_score`, `examples` (up to 2 comments, each ≤ 160 chars).
   - Also compute: `total_feedback`, counts per category, counts per sentiment, `period_start`, `period_end`.
3. **Write Digest Notes** (HTTP to Gemini, retries on, `onError: continueRegularOutput`)
   - Asks for JSON `{ overview: string ≤ 40 words, issues: [{ issue_group, insight ≤ 20 words, action ≤ 20 words }] }` for the given top 5.
   - Gemini must not change the ranking.
4. **Build Digest Email** (Code)
   - A clean, mobile-friendly HTML email with inline styles, a table layout, max width 600 px, and the ChopFast name.
   - Content: period and totals, a "Top 5 issues" table (rank, issue, count, angry count, suggested action), examples, and a category/sentiment summary line.
   - If Gemini failed, use plain fallback text ("Review these comments and assign an owner.").
   - Subject: `ChopFast weekly feedback digest — top 5 issues (<period_start> to <period_end>)`.
5. **Send Digest** (Gmail, to `__DIGEST_RECIPIENT_EMAIL__`). Skip if `send=false`.
6. **Log Digest** (Sheets append to `Digests`).
7. **Respond With Digest** (webhook path only): JSON `{ ok, period_start, period_end, batch_id, total_feedback, top_issues }`.

Use a Code node at the start of each trigger branch to set `{ batch_id, days, send }` so both triggers merge into the same downstream nodes.

### WF5 — `CFA 05 – Dashboard API`

**Trigger:** Webhook `GET /dashboard-data?days=7|30|all&batch_id=` with CORS enabled.

**Flow:** **Read All Feedback** (Sheets, Always Output Data) → **Aggregate** (Code) → **Respond** with JSON:

```json
{
  "ok": true,
  "generated_at": "...",
  "range": "7",
  "totals": { "feedback": 0, "complaints": 0, "bugs": 0, "ideas": 0, "praise": 0, "angry": 0, "avg_score": 0 },
  "by_sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
  "by_source": { "survey": 0, "email": 0, "google_review": 0, "test": 0 },
  "daily": [ { "date": "YYYY-MM-DD", "count": 0, "avg_score": 0 } ],
  "top_issues": [ { "issue_group": "", "count": 0, "angry_count": 0 } ],
  "recent": [ { "received_at": "", "source": "", "customer_name": "", "rating": 0, "comment": "", "category": "", "sentiment": "", "is_angry": false, "issue_group": "" } ]
}
```

Rules: `top_issues` uses the same ranking logic as WF4 (copy the function and keep the two identical). `recent` holds the latest 20, newest first, with `customer_email` **excluded** for privacy. `daily` covers the selected range (max 30 days).

---

## 8. Web app specification

### 8.1 General rules
- **Mobile-first and responsive.** Test at 360 px, 768 px and 1280 px widths. No horizontal scrolling at any width.
- Semantic HTML: `<header>`, `<main>`, `<nav>`, `<footer>`, real `<label>`s for every input, visible focus rings, a minimum 44 px tap target, and `lang="en"`.
- Fonts: the system font stack (no external font downloads).
- Colours: one primary colour (e.g. Tailwind `emerald`) plus neutrals. Status colours: green = positive, amber = neutral, red = negative/angry.
- Shared header on all pages: "ChopFast Feedback" wordmark (text only) and nav links Home · Give Feedback · Dashboard. On mobile, the nav collapses into a menu button with `aria-expanded`.
- `js/config.js` contains only `window.APP_CONFIG = { N8N_BASE_URL: "http://localhost:5678" };`
- `js/api.js` exposes `postFeedback(payload)` and `getDashboardData({ days, batchId })`. Both use a 15-second timeout via `AbortController` and throw friendly error messages.
- No inline `<script>` code except loading files. Load Chart.js from jsDelivr with a pinned version (look up the current version number with `npm view chart.js version`, then pin the CDN URL to it).

### 8.2 `index.html` (landing)
A short hero ("Turn customer comments into clear action"), three feature cards (AI tagging, angry-customer alerts, weekly top-5 digest), and two buttons: Give Feedback and View Dashboard.

### 8.3 `feedback.html` (survey trigger)
- Fields:
  - Name (optional)
  - Email (optional, `type=email`)
  - Rating: 1–5, as a radio-button star group that works with a keyboard
  - Comment (required, textarea, live character counter 0/2000)
  - Hidden honeypot field `website`
- Client-side validation mirrors the server rules.
- Submit: the button is disabled with a spinner while sending. `postFeedback({ source:"survey", ... })`.
- Success: replace the form with a thank-you panel and a "Send another" button. **Do not show the AI tags to the customer.**
- Error: an inline red message, and the form keeps its content.

### 8.4 `dashboard.html`
- Top bar: range selector (Last 7 days / Last 30 days / All time), a Refresh button, and "Last updated hh:mm" text. Auto-refresh every 60 seconds while the tab is visible.
- KPI cards (2 columns on mobile, 4 on desktop): Total feedback, Complaints + bugs, Angry customers, Average sentiment (shown as −1 to 1 with a colour).
- Charts (Chart.js, `responsive: true`, `maintainAspectRatio: false`, inside fixed-height containers):
  - Sentiment doughnut
  - Category bar chart
  - Daily feedback line chart
- **Top 5 issues:** ranked list with the count and a proportional bar, plus an angry badge.
- **Recent feedback:** a table on ≥ 768 px, stacked cards on mobile. Each shows date, source badge, category badge, sentiment dot, issue group and comment (truncated with "show more").
- States: loading skeletons, an empty state ("No feedback yet — try the form"), and an error state with a Retry button.

### 8.5 Build and serve
- `web/package.json` scripts:
  - `"build": "tailwindcss -i ./src/input.css -o ./public/css/styles.css --minify"`
  - `"watch": "tailwindcss -i ./src/input.css -o ./public/css/styles.css --watch"`
- `web/src/input.css` starts with `@import "tailwindcss";` and adds only small `@layer components` classes (`.btn`, `.card`, `.badge`).
- `web/netlify.toml`: `[build] base = "web"`, `command = "npm run build"`, `publish = "public"`.
- `scripts/serve-web.js`: serves `web/public` on `http://localhost:8080` using `node:http` and `node:fs`, with correct MIME types for html, css, js, svg and json.

---

## 9. Test data and verification

### 9.1 `test-data/feedback-50.json`
An array of exactly **50** objects:
`{ "n", "source", "customer_name", "customer_email", "rating", "comment", "expected_category", "expected_group", "expected_angry" }`

**Planted distribution (must be exact):**

| Expected group | Count | Category |
|---|---|---|
| slow delivery | 12 | complaint |
| app crashes | 9 | bug |
| rude support | 7 | complaint |
| wrong order | 5 | complaint |
| high price | 4 | complaint |
| praise (no group) | 8 | praise |
| ideas (various, no repeats) | 5 | idea |

**Rules:**
- Each planted group is worded in many different ways, with no copy-paste. For example, slow delivery: "food came 2 hours late", "rider took forever", "still waiting since 1pm", "delivery time is a joke".
- Use Nigerian names and a light, realistic Lagos context (areas, foods like jollof rice, suya). Keep it respectful and natural.
- Exactly **6 angry** comments: 3 slow delivery, 2 rude support, 1 app crashes. Mark them `expected_angry: true`. The remaining complaints are mildly unhappy, not angry.
- Sources: about 20 `survey`, 15 `email`, 15 `google_review`.
- Ideas must not overlap with the complaint groups, so they don't distort the ranking.
- Emails use the `example.com` domain only.

### 9.2 `scripts/send-test-feedback.js`
1. Creates `batch_id = "test-" + timestamp` and prints it.
2. POSTs each comment to `/webhook/feedback` **one at a time** (wait for each response so the groups build up), with `TEST_DELAY_MS` between calls to respect Gemini free-tier rate limits.
3. Shows progress `[12/50] slow delivery → got: slow delivery ✓`.
4. Saves `test-data/last-run.json` with the batch ID and every response (this file is git-ignored).

### 9.3 `scripts/verify-digest.js`
1. Reads `last-run.json` and calls `GET /webhook/digest-run?batch_id=<id>&days=30&send=true`. This sends exactly **one** digest email.
2. **Maps expected → actual:** for each planted group, the actual group is the `issue_group` most of its comments received.
3. **PASS conditions:**
   - The digest's top 5 groups are exactly those 5 mapped groups, in order (slow delivery, app crashes, rude support, wrong order, high price).
   - Each count is within ±1 of the planted count.
   - At least 5 of the 6 planted angry comments got `is_angry: true`.
4. Prints a clear report, including category accuracy and group accuracy, and exits with code 0 on PASS or 1 on FAIL.
5. Writes the results to `docs/test-report.md`: date, n8n version, Gemini model, per-group table, accuracy figures, and PASS/FAIL.

If verification fails, improve the prompt or the normalization (Section 7.1 / Parse Tags), not the test data. Re-run with a fresh batch. Record each attempt briefly in the test report.

---

## 10. Root `package.json` scripts

```json
{
  "name": "customer-feedback-analyzer",
  "private": true,
  "scripts": {
    "workflows:build": "node --env-file=.env scripts/build-workflows.js",
    "workflows:import": "powershell -ExecutionPolicy Bypass -File scripts/import-workflows.ps1",
    "web:build": "npm --prefix web run build",
    "web:serve": "node scripts/serve-web.js",
    "test:send": "node --env-file=.env scripts/send-test-feedback.js",
    "test:verify": "node --env-file=.env scripts/verify-digest.js"
  }
}
```

`import-workflows.ps1` reads `N8N_MODE` from `.env`:
- `npm`: `n8n import:workflow --separate --input=n8n/dist`
- `docker`: copy the files with `docker cp n8n/dist n8n:/tmp/cfa`, then `docker exec n8n n8n import:workflow --separate --input=/tmp/cfa`

It prints which workflows were imported and reminds the human to activate WF1, WF2, WF4 and WF5 in the n8n editor (WF3 only if Places is set up).

---

## 11. Build phases

### Phase 1 — Project skeleton and n8n runtime
1. Create the folder `customer-feedback-analyzer` in the human's chosen location (ask them; suggest `C:\Users\<name>\Projects`). Run `git init`, then create all config files (`.gitignore`, `.editorconfig`, `.env.example`, `.vscode/*`, root `package.json`, an empty README skeleton).
2. Copy `.env.example` to `.env`.
3. Decide the n8n mode:
   - Run `docker info`. If it succeeds, use Docker:
     - `docker volume create n8n_data`
     - `docker run -d --name n8n --restart unless-stopped -p 5678:5678 -e GENERIC_TIMEZONE=Africa/Lagos -e TZ=Africa/Lagos -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n`
   - Otherwise use npm: `npm install -g n8n`, and tell the human to run `n8n start` in a separate PowerShell window that stays open.
   - If n8n reports an unsupported Node.js version, stop and tell the human which Node LTS version to install.
   - Write the chosen mode to `N8N_MODE` in `.env`.
4. Check: `Invoke-WebRequest http://localhost:5678/healthz` returns 200.
5. **[HUMAN TASK]** Open `http://localhost:5678` in Chrome and create the n8n owner account.
6. Run the smoke test (Section 6.1, step 5).
7. Ask the human for their GitHub username. **[HUMAN TASK]** Create an empty GitHub repository named `customer-feedback-analyzer`. Then add the remote and push.
8. Commit: `chore: project skeleton and n8n runtime`.

### Phase 2 — Accounts, keys and the Google Sheet
Write `docs/setup-google.md` and `docs/setup-telegram.md` first. They must be precise, numbered and beginner-friendly. Then guide the human through each task and wait.

1. **[HUMAN TASK]** Create a Google Cloud project `chopfast-feedback`. Enable the **Google Sheets API**, **Google Drive API** and **Gmail API** (and **Places API (New)** only if billing is available).
2. **[HUMAN TASK]** Set up the OAuth consent screen (External, add their own Gmail as a test user). Create an OAuth client ID of type "Web application" with the redirect URI `http://localhost:5678/rest/oauth2-credential/callback`.
3. **[HUMAN TASK]** Get a Gemini API key at Google AI Studio.
4. Agent check: list the available models and choose the current recommended Flash model that supports `generateContent`. Write it to `GEMINI_MODEL`.
   - Command: `Invoke-RestMethod "https://generativelanguage.googleapis.com/v1beta/models" -Headers @{ "x-goog-api-key" = "<key from human, entered at a Read-Host prompt and never echoed>" }`
5. **[HUMAN TASK]** Create a Telegram bot with @BotFather and send it one message. The agent then fetches the chat ID via `getUpdates` (token entered at a `Read-Host -AsSecureString` prompt) and writes `TELEGRAM_CHAT_ID`.
6. **[HUMAN TASK]** Create the Google Sheet with tabs `Feedback` and `Digests`, and paste the header rows from `docs/sheet-structure.md`. Copy the sheet ID from the URL into `.env`.
7. **[HUMAN TASK]** In Gmail, create the label `feedback`. Fill in `DIGEST_RECIPIENT_EMAIL`.
8. Commit: `docs: setup guides and sheet structure`.

### Phase 3 — n8n credentials
**[HUMAN TASK]** In n8n → Credentials, create:
- Google Sheets OAuth2
- Gmail OAuth2 (same client ID and secret, then sign in)
- Telegram API (bot token)
- Header Auth "Gemini" (name `x-goog-api-key`, value = key)
- Optionally Header Auth "Places" (name `X-Goog-Api-Key`)

For each one, open it and copy the ID from the browser URL into the matching `CRED_*_ID` in `.env`. The agent provides exact click-by-click steps.

Check: `npm run workflows:build` reports no missing required keys (it can run with zero templates at this point).

### Phase 4 — WF1 Feedback Processor
1. Write `01-feedback-processor.template.json` per Section 7.
2. Build and import. **[HUMAN TASK]** Open it, confirm there are no red warning icons, and activate it.
3. Tests (PowerShell `Invoke-RestMethod`):
   - A valid praise → 200, category praise, a row appears in the sheet
   - An angry delivery complaint → 200, `is_angry` true, a Telegram alert arrives (human confirms)
   - A second delivery complaint worded differently → same `issue_group`
   - An empty comment → 400
   - The honeypot filled → 200, no row
4. Delete the test rows (or ask the human to) so real data starts clean.
5. Commit: `feat(n8n): feedback processor with AI tagging, grouping and alerts`.

### Phase 5 — WF2 Gmail Intake and WF3 Google Reviews Intake
1. Write, build and import both. **[HUMAN TASK]** Activate WF2. Activate WF3 only if Places is configured.
2. Test WF2: **[HUMAN TASK]** From another email account, send "The app keeps crashing at checkout" to their Gmail and apply the `feedback` label (or set a Gmail filter that labels messages automatically). Within about 2 minutes, a row with source `email` appears.
3. Test WF3 (if enabled): execute it once manually. New reviews appear, and a second run adds no duplicates.
4. Commit: `feat(n8n): gmail and google reviews intake`.

### Phase 6 — WF4 Weekly Digest and WF5 Dashboard API
1. Write, build and import both. **[HUMAN TASK]** Activate both.
2. Test WF5: `Invoke-RestMethod "$env:N8N_BASE_URL/webhook/dashboard-data?days=7"` returns the JSON shape exactly.
3. Test WF4: call `digest-run?days=7&send=false`. The JSON returns, and no email is sent. Then call with `send=true` once. The human confirms the email looks good on their phone.
4. Commit: `feat(n8n): weekly digest and dashboard api`.

### Phase 7 — Web app
1. Run `npm install --prefix web -D tailwindcss @tailwindcss/cli`, then `npm run web:build`.
2. Build `index.html`, `feedback.html`, `dashboard.html`, `api.js`, `feedback.js` and `dashboard.js` per Section 8.
3. `npm run web:serve`, then open `http://localhost:8080`. **[HUMAN TASK]** In Chrome DevTools device mode, check iPhone SE (375), Pixel 7 (412), iPad (768) and a laptop (1280) width.
4. Submit the form once. The row appears in the sheet, and the dashboard shows it after Refresh.
5. Run the CORS preflight check from 6.3 and apply the fallback if needed.
6. Commit: `feat(web): responsive feedback form and dashboard`.

### Phase 8 — The 50-comment acceptance test
1. Write `test-data/feedback-50.json` per 9.1. Verify the counts with a one-off PowerShell check that groups by `expected_group`, and print the table.
2. Write `send-test-feedback.js` and `verify-digest.js`.
3. `npm run test:send` (takes about 5–6 minutes), then `npm run test:verify`.
4. Iterate until PASS (see 9.3). **[HUMAN TASK]** Confirm that exactly one digest email arrived with the correct top 5.
5. Commit: `test: 50-comment acceptance test (PASS)`, including `docs/test-report.md`.

### Phase 9 — Deployment
1. Install cloudflared: `winget install --id Cloudflare.cloudflared -e`.
2. Start a quick tunnel: `cloudflared tunnel --url http://localhost:5678`. Copy the `https://<random>.trycloudflare.com` URL.
3. Put the tunnel URL in `web/public/js/config.js` and commit it. Explain to the human that this URL changes every time the tunnel restarts, so it must be updated before each demo.
4. **[HUMAN TASK]** Create a free Netlify account, choose "Import from Git", pick the GitHub repo, and keep the settings from `netlify.toml`.
5. Test the live site on the human's real phone (Android or iPhone) and laptop: submit feedback and view the dashboard.
6. Commit: `chore: deployment configuration`.

### Phase 10 — Documentation and polish
1. `README.md`:
   - Project title, OAU/SIWES context and one-paragraph summary
   - Features list, architecture diagram (Mermaid, copied from `docs/architecture.md`) and tech stack table
   - Folder structure, setup steps (linking to `docs/`), how to run daily (start n8n, start the tunnel, open the site)
   - How to run the acceptance test, test results summary, and screenshots section (placeholders for the human to add)
   - Limitations and future work (e.g. permanent tunnel, multi-business support, embedding-based grouping)
2. `docs/architecture.md`: a Mermaid diagram of sources → WF1 → Sheet / Telegram / WF4 digest, with WF5 → dashboard. Include a short paragraph per workflow and the n8n version used.
3. Final review pass:
   - No secrets in git (`git grep -n "AIza"` and `git grep -n "bot[0-9]"` return nothing)
   - No unused files, every file has its header comment, and HTML passes a quick manual check
4. Print a final checklist for the human's SIWES report: screenshots to take (each workflow canvas, the Google Sheet, a Telegram alert, the digest email, the dashboard on phone and laptop, terminal PASS output).
5. Final commit: `docs: readme, architecture and final polish`, then push.

---

## 12. Daily run guide (for the README)
1. Start n8n:
   - Docker: open Docker Desktop (the container restarts automatically)
   - npm: open PowerShell and run `n8n start`
2. For the public site: `cloudflared tunnel --url http://localhost:5678`, update `config.js` if the URL changed, commit and push (Netlify redeploys).
3. Open the Netlify site or `npm run web:serve` for local use.

## 13. Final acceptance checklist
- [ ] Survey form, Gmail and Google reviews (real or simulated) all create tagged rows
- [ ] Every row has category, sentiment, score, angry flag and issue group (praise excepted)
- [ ] Angry comments trigger a Telegram alert within seconds
- [ ] Repeated complaints share one `issue_group`
- [ ] The weekly digest is scheduled for Monday 08:00 Lagos time and is correct when run manually
- [ ] `npm run test:verify` prints PASS for the 50-comment batch; exactly one digest email was sent
- [ ] Dashboard and form work at 360 px, 768 px and 1280 px, and on a real phone
- [ ] No secrets committed; README and docs complete
