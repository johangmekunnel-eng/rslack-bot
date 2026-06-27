require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");

const api = express();
api.use(cors());
api.use(express.json());

// -------------------- SIMPLE JSON DATABASE --------------------
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
const GENERAL_PROMPT = `
You are R-Money, a helpful AI assistant.
Keep answers concise and clear.
`;

const STUDY_GUIDE_PROMPT = `
You are an expert high school tutor.

Create structured study guides with:
- Overview
- Key Concepts
- Examples
- Practice Questions
`;

const SUMMARY_PROMPT = `
You are an expert summarizer.
Return:
- Summary
- Key Points
- Important Terms
`;

// -------------------- GROQ AI --------------------
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

// -------------------- AI CHAT --------------------
api.post("/api/ai", async (req, res) => {
  const { message, userId } = req.body;

  try {
    const response = await getAIResponse(GENERAL_PROMPT, message);
    res.json({ response });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "AI failed" });
  }
});

// -------------------- STUDY GUIDE --------------------
api.post("/api/guide", async (req, res) => {
  const { topic, userId } = req.body;

  if (!topic) return res.status(400).json({ error: "No topic provided" });

  try {
    const answer = await getAIResponse(STUDY_GUIDE_PROMPT, topic);

    const db = loadDB();

    db.guides.push({
      userId,
      topic,
      content: answer,
      createdAt: Date.now()
    });

    saveDB(db);

    res.json({ response: answer });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Failed to create guide" });
  }
});

// -------------------- SUMMARY --------------------
api.post("/api/summarize", async (req, res) => {
  const { text, userId } = req.body;

  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    const answer = await getAIResponse(SUMMARY_PROMPT, text);

    const db = loadDB();

    db.summaries.push({
      userId,
      content: answer,
      createdAt: Date.now()
    });

    saveDB(db);

    res.json({ response: answer });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Failed to summarize" });
  }
});

// -------------------- GET ALL GUIDES --------------------
api.get("/api/guides/:userId", (req, res) => {
  const db = loadDB();

  const userGuides = db.guides.filter(
    (g) => g.userId === req.params.userId
  );

  res.json(userGuides);
});

// -------------------- GET ALL SUMMARIES --------------------
api.get("/api/summaries/:userId", (req, res) => {
  const db = loadDB();

  const userSummaries = db.summaries.filter(
    (s) => s.userId === req.params.userId
  );

  res.json(userSummaries);
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;

api.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});