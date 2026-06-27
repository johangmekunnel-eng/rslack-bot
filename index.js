require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const { App } = require("@slack/bolt");
const memory = {};
// -------------------- DATABASE --------------------
const db = new sqlite3.Database("./rmoney.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS guides (
      user_id TEXT,
      topic TEXT,
      content TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS summaries (
      user_id TEXT,
      content TEXT
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,
    content TEXT
  )
`);
});

// -------------------- EXPRESS APP (WEBSITE API) --------------------
const api = express();
api.use(cors());
api.use(express.json());

// -------------------- PROMPTS --------------------
const GENERAL_PROMPT = `
You are R-Money, a helpful AI assistant.
Keep answers concise and clear.
`;

// -------------------- AI FUNCTION --------------------
async function getAIResponse(systemPrompt, userPrompt) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}

// -------------------- API ROUTES (FOR WEBSITE) --------------------

// AI chat
api.post("/api/ai", async (req, res) => {
  const { message, userId } = req.body;

  try {
    // 1. Save user message
    db.run(
      "INSERT INTO chats (user_id, role, content) VALUES (?, ?, ?)",
      [userId, "user", message]
    );

    // 2. Get chat history
    db.all(
      "SELECT role, content FROM chats WHERE user_id = ? ORDER BY id DESC LIMIT 20",
      [userId],
      async (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "DB error" });
        }

        const history = rows.reverse().map(r => ({
          role: r.role,
          content: r.content
        }));

        const messages = [
          {
            role: "system",
            content: GENERAL_PROMPT
          },
          ...history
        ];

        const response = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.1-8b-instant",
            messages
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        const reply = response.data.choices[0].message.content;

        // 3. Save AI response
        db.run(
          "INSERT INTO chats (user_id, role, content) VALUES (?, ?, ?)",
          [userId, "assistant", reply]
        );

        res.json({ response: reply });
      }
    );

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "AI failed" });
  }
});

// Summaries
api.post("/api/summarize", async (req, res) => {
  const { text, userId } = req.body;

  try {
    const answer = await getAIResponse(SUMMARY_PROMPT, text);

    db.run(
      "INSERT INTO summaries (user_id, content) VALUES (?, ?)",
      [userId, answer]
    );

    res.json({ response: answer });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Failed to summarize" });
  }
});

// Get all guides (dashboard view)
api.get("/api/guides/:userId", (req, res) => {
  db.all(
    "SELECT * FROM guides WHERE user_id = ?",
    [req.params.userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// -------------------- START EXPRESS SERVER --------------------
api.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

// -------------------- SLACK BOT (OPTIONAL) --------------------
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

slackApp.command("/r-money-ping", async ({ command, ack, respond }) => {
  await ack();
  const latency = Date.now() - command.received_time * 1000;
  await respond(`Pong! ${latency}ms`);
});

// -------------------- START SLACK --------------------
(async () => {
  await slackApp.start();
  console.log("🤖 Slack bot running");
})();