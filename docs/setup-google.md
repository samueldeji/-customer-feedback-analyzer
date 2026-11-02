# Google Cloud, OAuth & Gemini Setup Guide

This guide walks you step-by-step through setting up Google Cloud APIs, OAuth credentials, Google AI Studio (Gemini), and Google Sheets for the Customer Feedback Analyzer.

---

## 1. Create Google Cloud Project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the project dropdown and click **New Project**.
3. Set **Project name** to: `chopfast-feedback`.
4. Leave Organization as "No organization" (or default) and click **Create**.
5. Ensure the new project `chopfast-feedback` is selected in the top bar.

---

## 2. Enable Required APIs

1. In the Google Cloud Console, navigate to **APIs & Services > Library** (or search in the top search bar).
2. Search for and **Enable** each of the following APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Gmail API**
3. *(Optional)* **Places API (New)**:
   - Only enable this if your Google Cloud project is linked to a billing account.
   - If you do not have a billing account, skip Places API. The project will automatically use simulated Google Reviews for testing.

---

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Select User Type: **External**, then click **Create**.
3. Under **App information**:
   - **App name**: `ChopFast Feedback Analyzer`
   - **User support email**: Select your email address.
   - **Developer contact information**: Enter your email address.
4. Click **Save and Continue**.
5. Under **Scopes**:
   - Click **Save and Continue** (n8n will request needed scopes during authentication).
6. Under **Test users**:
   - Click **+ Add Users**.
   - Enter your personal Gmail address (e.g. `adwuyisamuel@gmail.com`).
   - Click **Add**, then click **Save and Continue**.
7. Click **Back to Dashboard**.

---

## 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **+ Create Credentials** at the top, and select **OAuth client ID**.
3. In **Application type**, choose **Web application**.
4. Set **Name** to: `n8n Local OAuth Client`.
5. Under **Authorized redirect URIs**, click **+ Add URI** and enter:
   ```text
   http://localhost:5678/rest/oauth2-credential/callback
   ```
6. Click **Create**.
7. A dialog will show your **Client ID** and **Client Secret**:
   - Keep this dialog open or copy both values safely. You will paste these into n8n in Phase 3.

---

## 5. Get Google Gemini API Key

1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** in the left sidebar or top bar.
4. Click **Create API key** (you can select your `chopfast-feedback` project or a default project).
5. Copy the generated API key.
   > **Note:** Never commit this key to GitHub. It will be stored in your local `.env` and n8n credentials only.

---

## 6. Create the Google Sheet

1. Open [Google Sheets](https://sheets.new) to create a new spreadsheet.
2. Title it: **ChopFast Feedback Analyzer**.
3. Name the first tab **`Feedback`**.
4. Click the `+` button at the bottom to add a second tab, and name it **`Digests`**.
5. Paste the header rows into row 1 of each tab following [`docs/sheet-structure.md`](file:///C:/Users/adwuy/Projects/customer-feedback-analyzer/docs/sheet-structure.md).
6. Copy the **Google Sheet ID** from the browser URL:
   - URL format: `https://docs.google.com/spreadsheets/d/<GOOGLE_SHEET_ID>/edit`
   - Example: If the URL is `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`, the ID is `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`.

---

## 7. Gmail Feedback Label

1. Open [Gmail](https://mail.google.com/).
2. In the left sidebar, click **More > Create new label** (or the `+` next to Labels).
3. Name the label: `feedback`.
4. Click **Create**.
