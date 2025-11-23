// src/pages/AiInsights.jsx.
import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Trash2,
  X,
  Menu,
  Loader2,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import fglogo_Wbg from "../images/fglogo_Wbg.png";
import {useNavigate } from "react-router-dom";

// --- API CONFIGURATION ---
const API_BASE =  "https://fingenie-sz41.onrender.com/api/insights/chat/";

// Format timestamps
function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • ${d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  })}`;
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [copiedMap, setCopiedMap] = useState({});

  // --- STATE FOR DATA ---
  const [sessions, setSessions] = useState([]); // Sidebar list
  const [messages, setMessages] = useState([]); // Current chat messages
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // --- STATE FOR UI ---
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('userApiKey') || ''); // Get key from login
  
  // **CRITICAL**: Get User ID from login (or use a fallback for testing)
  // Ideally, your AuthFlow should save 'userId' to localStorage
  const userId = localStorage.getItem('userId') || "test-user-123"; 

  const chatBodyRef = useRef(null);

  // 1. LOAD SESSIONS (Sidebar) ON MOUNT
  useEffect(() => {
    fetchSessions();
  }, [userId]);

  // 2. SCROLL TO BOTTOM ON NEW MESSAGE
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // --- API ACTIONS ---

  async function fetchSessions() {
    try {
      const res = await fetch(`${API_BASE}/sessions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  }

  async function loadSession(sessionId) {
    setCurrentSessionId(sessionId);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.messages) {
        // Map backend format to UI format
        const uiMessages = data.messages.map(m => ({
          sender: m.role === 'model' ? 'bot' : 'user',
          text: m.text,
          ts: m.timestamp,
          liked: false
        }));
        setMessages(uiMessages);
      }
    } catch (error) {
      console.error("Failed to load messages", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function createNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setInputText("");
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text) return;
    if (!apiKey) {
        alert("Please log in or provide an API Key first.");
        return;
    }

    // 1. Show User Message Immediately (Optimistic UI)
    const userMsg = { sender: "user", text, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          user_id: userId,
          question: text,
          session_id: currentSessionId // Send ID if continuing a chat, null if new
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 2. Show Bot Response
      const botMsg = { 
        sender: "bot", 
        text: data.answer, 
        ts: new Date().toISOString() 
      };
      setMessages(prev => [...prev, botMsg]);

      // 3. Handle New Session Creation
      if (!currentSessionId && data.session_id) {
        setCurrentSessionId(data.session_id);
        // Add new session to top of sidebar without refetching
        setSessions(prev => [
            { id: data.session_id, title: data.title || text.slice(0, 30) + "...", created_at: new Date().toISOString() },
            ...prev
        ]);
      }

    } catch (err) {
      console.error("API error", err);
      const errorMsg = { sender: "bot", text: `Error: ${err.message}`, ts: new Date().toISOString() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  }

  // --- UTILS ---
  async function copyToClipboard(text, idx) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMap(prev => ({ ...prev, [idx]: true }));
      setTimeout(() => {
        setCopiedMap(prev => {
          const x = { ...prev };
          delete x[idx];
          return x;
        });
      }, 1200);
    } catch {}
  }

  // --- RENDER ---
  return (
    <div style={styles.pageContainer}>
      {/* Responsive rules for smaller screens */}
      <style>{`
        /* Existing small-screen hide */
        @media (max-width: 900px) {
          .sidebar-desktop { display: none; }
        }

        /* Layout tweaks for medium and small screens */
        @media (max-width: 900px) {
          .main-area {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 12px !important;
            height: calc(100vh - 120px) !important;
          }

          .chat-container {
            width: 100% !important;
            height: calc(100vh - 140px) !important;
            border-radius: 12px !important;
          }

          .chat-body {
            background-image: none !important;
            background-position: initial !important;
            background-size: auto !important;
            padding-bottom: 84px !important; /* space for sticky input */
          }

          .message-bubble {
            max-width: 92% !important;
          }

          .sidebar-show-btn {
            position: fixed !important;
            top: 12px !important;
            left: 12px !important;
            z-index: 1200 !important;
            box-shadow: 0 6px 18px rgba(0,0,0,0.08);
          }

          .input-area {
            position: sticky !important;
            bottom: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 12px !important;
            background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,250,0.9)) !important;
            border-top: 1px solid rgba(30,40,50,0.06) !important;
            z-index: 1000;
          }

          .sidebar-desktop {
            width: 100% !important;
            position: relative !important;
            height: auto !important;
          }
        }

        /* Extra-small screens: condensed spacing */
        @media (max-width: 480px) {
          .chat-header img { height: 36px !important; }
          .chat-header div > div { font-size: 16px !important; }
          .historyItem { padding: 12px !important; font-size: 13px !important; }
          .message-bubble { padding: 10px !important; border-radius: 12px !important; }
          .input { padding: 0.6rem 0.8rem !important; font-size: 14px !important; }
          .send-button { padding: 0.55rem 0.9rem !important; font-size: 14px !important; }
        }
      `}</style>

      <Header navigate={navigate} />

      <div className="main-area" style={styles.mainArea}>
        
        {/* SIDEBAR */}
        {sidebarVisible ? (
          <aside className="sidebar-desktop" style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <button style={styles.sidebarIconBtn} onClick={createNewChat} title="New chat">
                <Plus size={18} />
              </button>
              <button style={styles.sidebarIconBtn} onClick={() => setSidebarVisible(false)} title="Hide sidebar">
                <X size={18} />
              </button>
            </div>

            <div style={styles.historyList}>
              {sessions.length === 0 && (
                  <div style={{padding: 14, fontSize: 13, color: '#8b96a3', textAlign: 'center'}}>
                    No history yet. Start a new chat!
                  </div>
              )}
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    ...styles.historyItem,
                    background: s.id === currentSessionId ? "linear-gradient(180deg,#e6f0fa,#dfeef7)" : "#fff",
                    border: s.id === currentSessionId ? "1px solid rgba(82,120,180,0.25)" : styles.historyItem.border,
                  }}
                  onClick={() => loadSession(s.id)}
                >
                  <div style={styles.historyPreview}>{s.title}</div>
                  <div style={styles.historyTime}>{fmtTime(s.created_at)}</div>
                </div>
              ))}
            </div>
          </aside>
        ) : (
          <button
            className="sidebar-show-btn"
            style={styles.sidebarShowButton}
            onClick={() => setSidebarVisible(true)}
            title="Show chats"
          >
            <Menu size={20} />
          </button>
        )}

        {/* CHAT AREA */}
        <div className="chat-container" style={styles.chatContainer}>
          <div className="chat-header" style={styles.chatHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={fglogo_Wbg} alt="bot" style={{ height: 44 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: "#1f3b4d" }}>FinGenie Insights</div>
                <div style={{ fontSize: 12, color: "#5d6e77" }}>
                  {isLoadingHistory ? "Loading..." : "AI Financial Assistant"}
                </div>
              </div>
            </div>
          </div>

          <div ref={chatBodyRef} className="chat-body" style={styles.chatBody}>
            {messages.length === 0 && !isLoadingHistory ? (
                  <div style={{ padding: 40, textAlign: 'center', color: "#888" }}>
                      <h3 style={{marginBottom: 10, fontWeight: 600}}>Welcome to AI Insights</h3>
                      <p>Ask any financial question to get started.</p>
                     </div>
                  ) :(
                messages.map((m, idx) => (
                <div
                    key={idx}
                    style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                    }}
                >
                    <div
                    className="message-bubble"
                    style={{
                        ...styles.messageBubble,
                        background: m.sender === "user" ? "#e6f0f6" : "linear-gradient(180deg,#ffffff, #fbfdff)",
                        border: m.sender === "user" ? "1px solid rgba(31,59,77,0.06)" : "1px solid rgba(20,30,40,0.03)"
                    }}
                    >
                    <div style={{ whiteSpace: "pre-wrap", color: "#24313a" }}>{m.text}</div>

                    {/* Actions Row */}
                    <div style={styles.iconRow}>
                        <button
                        style={styles.iconBtn}
                        onClick={() => copyToClipboard(m.text, idx)}
                        title="Copy"
                        >
                        {copiedMap[idx] ? <span style={{ color: "#1f8d5a", fontWeight: 700 }}>✓</span> : <Copy size={14} />}
                        </button>
                        
                        <div style={{ marginLeft: 12, fontSize: 11, color: "#94a0a6" }}>
                            {fmtTime(m.ts)}
                        </div>
                    </div>
                    </div>
                </div>
                ))
            )}
            
            {isSending && (
                <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
                    <div style={{ ...styles.messageBubble, background: "#fff" }}>
                        <Loader2 className="animate-spin" size={16} />
                    </div>
                </div>
            )}
          </div>

          <div className="input-area" style={styles.inputArea}>
            <input
              type="text"
              placeholder="Ask FinGenie anything..."
              className="input"
              style={styles.input}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isSending}
            />
            <button
              className="send-button"
              style={{ ...styles.sendButton, opacity: isSending ? 0.6 : 1, cursor: isSending ? 'not-allowed' : 'pointer' }}
              onClick={sendMessage}
              disabled={isSending}
            >
              {isSending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// --- STYLES (Updated to match home page theme: soft pastel teal, rounded cards, glass effect) ---
const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Montserrat','Inter',sans-serif",
    // soft gradient inspired by the uploaded homepage
    background: "linear-gradient(180deg,#f3f7f8 0%, #fbfcfd 50%)",
    color: "#2d3748",
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 2rem', backgroundColor: '#DEE6E6', border: '1px solid #000000ff', borderRadius: '8px', position: 'sticky', top: 0, zIndex: 100 },
  headerLeft: { display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center' },
  nav: { display: 'flex', alignItems: 'center', gap: '2rem' },
  navLink: { fontSize: '0.95rem', fontWeight: '500', color: '#4a5568', cursor: 'pointer', transition: 'color 0.3s ease', textDecoration: 'none', position: 'relative' },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  userIcon: { cursor: 'pointer', color: '#4a5568', transition: 'color 0.3s ease' },
  toolsMenu: { position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  userMenu: { position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  HFdropdown: { position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '200px', zIndex: 1000 },
  dropdownItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background-color 0.2s', fontSize: '0.95rem' },
  mainArea: { display: "flex", gap: "1rem", padding: "1.25rem", height: "calc(100vh - 140px)", boxSizing: "border-box" },
  sidebar: {
    width: 340,
    background: "linear-gradient(180deg,#ffffff,#f6fbfc)",
    border: "1px solid rgba(30,50,65,0.06)",
    borderRadius: 14,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    boxSizing: "border-box",
    boxShadow: "0 8px 24px rgba(18,38,60,0.04)",
    backdropFilter: "saturate(120%) blur(6px)",
  },
  sidebarHeader: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  sidebarIconBtn: { width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(30,40,50,0.06)", background: "#f3f7f8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  sidebarShowButton: { width: 48, height: "100%", background: "linear-gradient(180deg,#e9f2f6,#dfeff5)", border: "1px solid rgba(30,40,50,0.06)", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8 },
  historyList: { marginTop: 12, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1, paddingRight: 6 },
  historyItem: { padding: 14, borderRadius: 12, cursor: "pointer", fontSize: 14, border: "1px solid rgba(20,30,40,0.03)", boxShadow: "0 2px 8px rgba(18,38,60,0.03)" },
  historyPreview: { fontSize: 13, color: "#0f2430", fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  historyTime: { fontSize: 11, color: "#7f8a90" },
  chatContainer: {
    flex: 1,
    // soft glass card
    background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,252,253,0.95))",
    borderRadius: 16,
    border: "1px solid rgba(30,40,50,0.04)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(31,54,68,0.06)",
    position: "relative",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    padding: "1.25rem 1.25rem",
    // header gradient to reflect the teal/soft-blue from homepage
    background: "linear-gradient(90deg, rgba(226,238,240,0.9), rgba(219,232,234,0.9))",
    borderBottom: "1px solid rgba(30,40,50,0.04)",
    gap: 12,
  },
  chatBody: {
    padding: "1rem",
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background:
      // subtle decorative top-left image from your uploaded screenshot for consistency
      `url("/mnt/data/315476d8-013b-4796-962e-afa76854f326.png") no-repeat left -30px top -120px, #F7F7F7`,
    backgroundSize: "700px auto",
    backgroundBlendMode: "overlay",
  },
  messageBubble: {
    padding: "0.85rem 1rem",
    borderRadius: 14,
    maxWidth: "78%",
    boxShadow: "0 6px 18px rgba(18,38,60,0.04)",
    lineHeight: 1.45,
  },
  iconRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 10 },
  iconBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: '#64707a' },
  inputArea: { display: "flex", gap: 12, padding: "1rem", borderTop: "1px solid rgba(30,40,50,0.04)", background: "rgba(255,255,255,0.6)" },
  input: { flex: 1, padding: "0.75rem 1rem", borderRadius: 12, border: "1px solid rgba(30,40,50,0.06)", fontSize: 14, outline: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)" },
  sendButton: { padding: "0.6rem 1.5rem", borderRadius: 12, border: "none", background: "linear-gradient(180deg,#2f3f60,#26324f)", color: "white", cursor: "pointer", fontWeight: 800, letterSpacing: 0.3 },
  quickBtn: { padding: "0.5rem 0.9rem", borderRadius: 10, border: "1px solid rgba(31,59,77,0.06)", background: "#edf6fa", cursor: "pointer", fontWeight: 700, color: "#1f546b" },
  footer: { backgroundColor: '#4D5C61', color: '#FFFFFF', padding: '2rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4rem', position: 'relative', zIndex: 5 },
  footerLeft: { flex: 1, alignItems: 'center' },
  copyright: { fontSize: '0.9rem', color: '#cbd5e0', margin: 0 },
  footerLink: { color: '#FFFFFF', textDecoration: 'none', transition: 'opacity 0.3s' },
  footerRight: { flex: 1, textAlign: 'right' },
  functionsTitle: { fontSize: '14px', fontWeight: '700', marginRight: '8rem' },
  functionsList: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: '3.5fr 1fr', textAlign: 'right', gap: '6px 0px' },
  functionsItem: { fontSize: '13px', margin: 0, textTransform: "capitalize", whiteSpace: 'nowrap' },
};
