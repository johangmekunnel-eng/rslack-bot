import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = "http://localhost:3000";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/ai`, {
        message: userMsg,
        userId: "web-user",
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ Error contacting AI" },
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>🤖 R-Money AI</div>

      {/* CHAT AREA */}
      <div style={styles.chat}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...styles.messageRow,
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...styles.bubble,
                backgroundColor:
                  m.role === "user" ? "#2b6fff" : "#2a2a2a",
                color: m.role === "user" ? "white" : "#e5e5e5",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={styles.messageRow}>
            <div style={{ ...styles.bubble, background: "#2a2a2a" }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div style={styles.inputBar}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message R-Money..."
          style={styles.input}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage} style={styles.button}>
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#1e1e1e",
    color: "white",
    fontFamily: "Arial",
  },

  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #333",
    fontWeight: "bold",
  },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  messageRow: {
    display: "flex",
  },

  bubble: {
    padding: "10px 14px",
    borderRadius: "14px",
    maxWidth: "70%",
    fontSize: "14px",
    lineHeight: "1.4",
    whiteSpace: "pre-wrap",
  },

  inputBar: {
    display: "flex",
    padding: "12px",
    borderTop: "1px solid #333",
    backgroundColor: "#1a1a1a",
    gap: "10px",
  },

  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #333",
    backgroundColor: "#2a2a2a",
    color: "white",
    outline: "none",
  },

  button: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2b6fff",
    color: "white",
    cursor: "pointer",
  },
};