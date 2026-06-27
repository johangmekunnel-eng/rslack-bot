require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- DATABASE (JSON) --------------------
const DB_FILE = "./db.json";

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { guides: [], summaries: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// -------------------- PROMPTS --------------------
const GENERAL_PROMPT = `You are a helpful AI assistant. Be concise.`;
const GUIDE_PROMPT = `You are a teacher. Create structured study guides.`;
const SUMMARY_PROMPT = `You are a summarizer. Be clear and structured.`;

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

// -------------------- ROUTES --------------------

// AI CHAT
app.post("/api/ai", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await getAI(GENERAL_PROMPT, message);
    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: "AI failed" });
  }
});

// STUDY GUIDE
app.post("/api/guide", async (req, res) => {
  try {
    const { topic, userId } = req.body;

    const response = await getAI(GUIDE_PROMPT, topic);

    const db = loadDB();
    db.guides.push({ userId, topic, content: response });
    saveDB(db);

    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: "Guide failed" });
  }
});

// SUMMARY
app.post("/api/summarize", async (req, res) => {
  try {
    const { text, userId } = req.body;

    const response = await getAI(SUMMARY_PROMPT, text);

    const db = loadDB();
    db.summaries.push({ userId, content: response });
    saveDB(db);

    res.json({ response });
  } catch (e) {
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

// -------------------- START --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("API running on", PORT));