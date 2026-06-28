require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();

// -------------------- MIDDLEWARE --------------------

app.use(cors());
app.use(express.json());

// -------------------- DATABASE (JSON FILE) --------------------

const DB_FILE = "./db.json";

function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { guides: [], summaries: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (err) {
    console.log("DB load error:", err);
    return { guides: [], summaries: [] };
  }
}

function saveDB(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.log("DB save error:", err);
  }
}

// -------------------- PROMPTS --------------------

const GENERAL_PROMPT = `
You are a helpful AI assistant. Be clear and concise.
`;

const GUIDE_PROMPT = `
You are an expert teacher.

Create structured study guides:
- Overview
- Key Concepts
- Examples
- Practice Questions
`;

const SUMMARY_PROMPT = `
You are an expert summarizer:
- Summary
- Key Points
- Important Terms
`;

// -------------------- AI FUNCTION --------------------

async function getAI(systemPrompt, userPrompt) {
  const res = await axios.post(
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

  return res.data.choices[0].message.content;
}

// -------------------- API ROUTES --------------------

// Health check
app.get("/api", (req, res) => {
  res.json({
    status: "online",
    message: "R-Money API is running 🚀",
    routes: ["/api/ai", "/api/guide", "/api/summarize"]
  });
});

// AI CHAT
app.post("/api/ai", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const response = await getAI(GENERAL_PROMPT, message);
    res.json({ response });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "AI failed" });
  }
});

// STUDY GUIDE
app.post("/api/guide", async (req, res) => {
  try {
    const { topic, userId } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic required" });

    const response = await getAI(GUIDE_PROMPT, topic);

    const db = loadDB();
    db.guides.push({
      userId: userId || "anonymous",
      topic,
      content: response,
      time: Date.now()
    });
    saveDB(db);

    res.json({ response });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Guide failed" });
  }
});

// SUMMARY
app.post("/api/summarize", async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });

    const response = await getAI(SUMMARY_PROMPT, text);

    const db = loadDB();
    db.summaries.push({
      userId: userId || "anonymous",
      content: response,
      time: Date.now()
    });
    saveDB(db);

    res.json({ response });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Summary failed" });
  }
});

// GET DATA
app.get("/api/guides/:userId", (req, res) => {
  const db = loadDB();
  res.json(db.guides.filter(g => g.userId === req.params.userId));
});

app.get("/api/summaries/:userId", (req, res) => {
  const db = loadDB();
  res.json(db.summaries.filter(s => s.userId === req.params.userId));
});

// -------------------- SERVE REACT FRONTEND --------------------

app.use(express.static(path.join(__dirname, "rmoney-dashboard/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "rmoney-dashboard/dist/index.html"));
});

// -------------------- START SERVER --------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});