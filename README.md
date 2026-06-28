 R-Money AI Chat App

A full-stack AI-powered chat and study assistant built with React (Vite) on the frontend and Node.js + Express on the backend. It integrates the Groq API to generate fast LLM responses and supports study guides and summaries with simple data persistence.

 Live Demo
Frontend + Backend: 
API Base: rslack-bot-production.up.railway.app
Features
  AI Chat (Groq LLM integration)
  Study Guide Generator
  Text Summarizer
  Simple JSON-based storage

Frontend:

React (Vite)
Axios
Vanilla CSS (inline styling)

Backend:

Node.js
Express.js
Axios (API requests)
File-based JSON database

AI:

Groq API (LLaMA 3)
Project Structure
slack/
│
├── index.js              # Backend server (Express API)
├── db.json               # Local database storage
├── package.json
│
├── rmoney-dashboard/     # Frontend (Vite React app)
│   ├── src/
│   ├── dist/             # Production build (served by backend)
│   └── package.json
Setup Instructions
1. Clone the repo
git clone https://github.com/your-username/rslack-bot.git
cd rslack-bot
2. Install backend dependencies
npm install
3. Setup frontend
cd rmoney-dashboard
npm install
npm run build
cd ..
4. Add environment variables

Create a .env file in the root:

GROQ_API_KEY=your_api_key_here
5. Run locally
node index.js

Server runs on:

http://localhost:3000
API Endpoints
Chat AI
POST /api/ai
{
  "message": "Hello",
  "userId": "123"
}
Study Guide
POST /api/guide
{
  "topic": "Photosynthesis",
  "userId": "123"
}
Summary
POST /api/summarize
{
  "text": "Long article text",
  "userId": "123"
}
Deployment (Railway)
Build command:
cd rmoney-dashboard && npm install && npm run build
Start command:
node index.js
Notes
db.json is used for simple storage (not production-scale)
Frontend is served from /rmoney-dashboard/dist
Make sure GROQ_API_KEY is set in production
Future Improvements
Replace JSON DB with PostgreSQL / MongoDB
Add authentication (Google login)
Improve UI (chat bubbles + history sidebar)
Stream AI responses
Mobile optimization
Author

Built by Johan Mekkunnel
