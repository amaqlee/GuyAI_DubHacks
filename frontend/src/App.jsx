import { useState, useRef, useEffect } from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Account from "./pages/Account";
import mascotGif from "./assets/guygif.gif";
import mascotStatic from "./assets/guy.png";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentWeek, setCurrentWeek] = useState(1);
  const [totalWeeks, setTotalWeeks] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  //dynamically gets the number of weeks (so you can upload more weeks of data)
  useEffect(() => {
    fetch("/api/weeks")
      .then((r) => r.json())
      .then((d) => setTotalWeeks(d.total_weeks));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, week: currentWeek }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Could not connect to the backend." },
      ]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <span className="header-brand">
          GuyAI
          <div className = "mascot-wrapper">
            <img src = {mascotGif} alt = "GuyAI Mascot" className = "header-mascot animated"/>
            <img src = {mascotStatic} alt = "GuyAI Mascot" className = "header-mascot static"/>
          </div>
        </span>

        <nav className="header-nav">
          {["dashboard", "insights", "account"].map((page) => (
            <button
              key={page}
              className={`nav-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}
        </nav>

        <div className="week-switcher">
          <button
            className="week-arrow"
            onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
            disabled={currentWeek === 1}
          >
            ‹
          </button>
          <span className="week-label">Week {currentWeek}</span>
          <button
            className="week-arrow"
            onClick={() => setCurrentWeek((w) => Math.min(totalWeeks, w + 1))}
            disabled={currentWeek === totalWeeks}
          >
            ›
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="main-layout">
        <main className="page-area">
          {currentPage === "dashboard" && <Dashboard week={currentWeek} />}
          {currentPage === "insights" && <Insights week={currentWeek} />}
          {currentPage === "account" && <Account /> }
         </main>

        {/* ── Chat rail ── */}
        <aside className="chat-rail">
          <div className="chat-header">
            <span className="chat-title">GUY</span>
          </div>

          <div className="chat-body">
            {messages.length === 0 && (
              <p className="chat-empty">Ask Guy anything about your business…</p>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
            />
            <button className="chat-send" onClick={sendMessage}>
              Send
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
