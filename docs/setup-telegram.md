# Telegram Bot Alert Setup Guide

This guide walks you step-by-step through setting up a Telegram bot to receive real-time alerts when angry or high-severity customer feedback is received.

---

## 1. Create a Bot with BotFather

1. Open the [Telegram app](https://web.telegram.org/) or desktop client on your phone or computer.
2. In the Telegram search bar, search for `@BotFather` (ensure it has the official blue checkmark).
3. Start a chat and click **Start** (or send `/start`).
4. Send the command:
   ```text
   /newbot
   ```
5. Follow BotFather's prompts:
   - **Name for your bot**: e.g. `ChopFast Alerts`
   - **Username for your bot**: must end in `bot` (e.g. `chopfast_feedback_samuel_bot`).
6. BotFather will reply with a congratulatory message containing your **HTTP API Token**:
   - Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz...`
   - Save this token securely. Do not share it publicly.

---

## 2. Start the Bot Chat

1. In the BotFather confirmation message, click the link to your new bot (e.g. `t.me/your_bot_username`).
2. Click **Start** or send any test message like `hello`.
   *(Important: Telegram bots cannot message you first until you initiate the conversation.)*

---

## 3. Retrieve Your Chat ID

Once you have messaged your bot, the agent will query the Telegram API `getUpdates` endpoint to automatically detect your `TELEGRAM_CHAT_ID` and save it to `.env`.
