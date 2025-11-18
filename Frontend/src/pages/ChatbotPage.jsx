// src/pages/ChatbotPage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  User,
  History,
  Settings,
  LogOut,
  Wrench,
  TrendingUp,
  Search,
  Activity,
  BookOpen,
  Cpu,
  GitCompare,
  Plus,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Trash2,
  X,
  Menu,
} from "lucide-react";

import fglogo_Wbg from "../images/fglogo_Wbg.png";
import { useNavigate, useLocation } from "react-router-dom";

// Format timestamps
function fmtTime(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • ${d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  })}`;
}

// Simple confirm wrapper
function confirmAction(message) {
  return window.confirm(message);
}

export default function ChatbotPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [copiedMap, setCopiedMap] = useState({});

  // chat data
  const [chats, setChats] = useState(() => [
    {
      id: 1,
      messages: [
        {
          sender: "bot",
          text: "Hello — I'm FinGenie. Ask me about the report.",
          ts: Date.now() - 1000 * 60 * 45,
          liked: false,
          disliked: false,
        },
        {
          sender: "user",
          text: "What was revenue last quarter?",
          ts: Date.now() - 1000 * 60 * 44,
        },
        {
          sender: "bot",
          text: "Revenue last quarter (demo): ₹120M.",
          ts: Date.now() - 1000 * 60 * 43,
          liked: false,
          disliked: false,
        },
      ],
      updatedAt: Date.now() - 1000 * 60 * 43,
    },
    {
      id: 2,
      messages: [
        {
          sender: "bot",
          text: "Sector trends summary (demo).",
          ts: Date.now() - 1000 * 60 * 20,
          liked: false,
          disliked: false,
        },
      ],
      updatedAt: Date.now() - 1000 * 60 * 20,
    },
  ]);

  const [currentChatId, setCurrentChatId] = useState(chats[0].id);
  const [inputText, setInputText] = useState("");

  // Chat body scrolling ref
  const chatBodyRef = useRef(null);

  useEffect(() => {
    try {
      const el = chatBodyRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    } catch {}
  }, [chats, currentChatId]);

  const getChat = (id) => chats.find((c) => c.id === id);

  // Create new chat
  function createNewChat() {
    const newId = chats.length ? Math.max(...chats.map((c) => c.id)) + 1 : 1;
    const newChat = {
      id: newId,
      messages: [
        {
          sender: "bot",
          text: "New session started. How can I help?",
          ts: Date.now(),
          liked: false,
          disliked: false,
        },
      ],
      updatedAt: Date.now(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newId);
    setInputText("");
  }

  // Send message + demo bot reply
  function sendMessage() {
    const text = inputText.trim();
    if (!text) return;

    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== currentChatId) return c;

        const userMsg = { sender: "user", text, ts: Date.now() };
        const botMsg = {
          sender: "bot",
          text: `Demo reply: I heard "${text}".`,
          ts: Date.now() + 5,
          liked: false,
          disliked: false,
        };

        return { ...c, messages: [...c.messages, userMsg, botMsg], updatedAt: Date.now() };
      })
    );

    setInputText("");

    requestAnimationFrame(() => {
      try {
        const el = chatBodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      } catch {}
    });
  }

  // Copy message
  async function copyToClipboard(text, chatId, msgIndex) {
    try {
      await navigator.clipboard.writeText(text);

      const key = `${chatId}_${msgIndex}`;
      setCopiedMap((prev) => ({ ...prev, [key]: true }));

      setTimeout(() => {
        setCopiedMap((prev) => {
          const x = { ...prev };
          delete x[key];
          return x;
        });
      }, 1200);
    } catch {}
  }

  // Bots only: Like/Dislike
  function toggleLike(chatId, msgIndex) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;

        const msgs = c.messages.map((m, i) =>
          i === msgIndex ? { ...m, liked: !m.liked, disliked: m.liked ? m.disliked : false } : m
        );

        return { ...c, messages: msgs };
      })
    );
  }

  function toggleDislike(chatId, msgIndex) {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;

        const msgs = c.messages.map((m, i) =>
          i === msgIndex ? { ...m, disliked: !m.disliked, liked: m.disliked ? m.liked : false } : m
        );

        return { ...c, messages: msgs };
      })
    );
  }

  // Share (bot only)
  async function shareText(text) {
    if (navigator.share) {
      try {
        await navigator.share({ title: "FinGenie message", text });
      } catch {}
    } else {
      await copyToClipboard(text);
    }
  }

  // Delete a full conversation
  async function deleteChatFromHistory(id) {
    if (!confirmAction("Delete this chat?")) return;

    setChats((prev) => prev.filter((c) => c.id !== id));

    if (id === currentChatId) {
      const remaining = chats.filter((c) => c.id !== id);
      setCurrentChatId(remaining.length ? remaining[0].id : null);
    }
  }

  /* --------------------------------
     HEADER COMPONENT
  -------------------------------- */
  const Header = () => (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <div style={styles.logo}>
          <img src={fglogo_Wbg} style={{ height: "80px" }} alt="logo" />
        </div>
      </div>

      <nav style={styles.nav}>
        <span style={styles.navLink} onClick={() => navigate("/mainpageafterlogin")}>
          Home
        </span>
        <span style={styles.navLink} onClick={() => navigate("/NewsPage")}>
          News
        </span>
        <span style={styles.navLink} onClick={() => navigate("/AboutUs")}>
          About us
        </span>

        {/* Tools */}
        <div
          style={styles.toolsMenu}
          onMouseEnter={() => setShowToolsDropdown(true)}
          onMouseLeave={() => setShowToolsDropdown(false)}
        >
          <Wrench size={24} color="black" />

          {showToolsDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownItem}>
                <TrendingUp size={16} />
                <span>Debt Ratings</span>
              </div>
              <div style={styles.dropdownItem}>
                <Search size={16} />
                <span>Search Companies</span>
              </div>
              <div style={styles.dropdownItem}>
                <Activity size={16} />
                <span>Trends & KPIs</span>
              </div>
              <div style={styles.dropdownItem}>
                <BookOpen size={16} />
                <span>Blog Page</span>
              </div>
              <div style={styles.dropdownItem} onClick={() => navigate("/FileUploadApp")}>
                <Cpu size={16} />
                <span>AI Summary</span>
              </div>
              <div style={styles.dropdownItem}>
                <GitCompare size={16} />
                <span>Comparison</span>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div
          style={styles.userMenu}
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <User size={24} color="black" />

          {showDropdown && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownItem}>
                <User size={16} />
                <span>Profile</span>
              </div>
              <div style={styles.dropdownItem}>
                <History size={16} />
                <span>History</span>
              </div>
              <div style={styles.dropdownItem}>
                <Settings size={16} />
                <span>Settings</span>
              </div>
              <div style={styles.dropdownItem} onClick={() => navigate("/homepage_beforelogin")}>
                <LogOut size={16} />
                <span>Sign out</span>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );

  /* --------------------------------
     FOOTER COMPONENT
  -------------------------------- */
  const Footer = () => (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.footerLeft}>
          <p style={styles.copyright}>
            © 2025 FinGenie |{" "}
            <a href="#about" style={styles.footerLink}>
              About
            </a>{" "}
            |{" "}
            <a href="#blog" style={styles.footerLink}>
              Blog
            </a>{" "}
            |{" "}
            <a href="#privacy" style={styles.footerLink}>
              Privacy Policy
            </a>{" "}
            |{" "}
            <a href="#contact" style={styles.footerLink}>
              Contact
            </a>
          </p>
        </div>

        <div style={styles.footerRight}>
          <h4 style={styles.functionsTitle}>functions</h4>
          <ul style={styles.functionsList}>
            <li style={styles.functionsItem}>AI summary</li>
            <li style={styles.functionsItem}>Debt ratings</li>
            <li style={styles.functionsItem}>stock graphs</li>
            <li style={styles.functionsItem}>search companies</li>
          </ul>
        </div>
      </div>
    </footer>
  );
  const activeChat = getChat(currentChatId) || null;

  /* --------------------------------
     RENDER
  -------------------------------- */
  return (
    <div style={styles.pageContainer}>
      <style>{`
        @media (max-width: 900px) {
          .sidebar-desktop { display: none; }
        }
      `}</style>

      <Header />

      <div style={styles.mainArea}>
        {sidebarVisible ? (
          <aside className="sidebar-desktop" style={styles.sidebar}>

            {/* SIDEBAR TOP BUTTONS */}
            <div style={styles.sidebarHeader}>
              <button
                style={styles.sidebarIconBtn}
                onClick={createNewChat}
                title="New chat"
                aria-label="New chat"
              >
                <Plus size={18} />
              </button>

              <button
                style={styles.sidebarIconBtn}
                onClick={() => setSidebarVisible(false)}
                title="Hide sidebar"
                aria-label="Hide sidebar"
              >
                <X size={18} />
              </button>
            </div>

            {/* CHAT HISTORY */}
            <div style={styles.historyList}>
              {chats.map((c) => {
                const last = c.messages[c.messages.length - 1];
                const preview = last
                  ? last.text.length > 80
                    ? last.text.slice(0, 77) + "..."
                    : last.text
                  : "No messages";

                return (
                  <div
                    key={c.id}
                    style={{
                      ...styles.historyItem,
                      background: c.id === currentChatId ? "#DCE5F5" : "#fff",
                    }}
                    onClick={() => setCurrentChatId(c.id)}
                  >
                    <div>
                      <div style={styles.historyPreview}>{preview}</div>
                      <div style={styles.historyTime}>
                        {last ? fmtTime(last.ts) : fmtTime(c.updatedAt)}
                      </div>
                    </div>

                    {/* DELETE CHAT */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 8,
                      }}
                    >
                      <button
                        style={styles.historyDeleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatFromHistory(c.id);
                        }}
                        title="Delete chat"
                        aria-label={`Delete chat ${c.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        ) : (
          <button
            style={styles.sidebarShowButton}
            onClick={() => setSidebarVisible(true)}
            aria-label="Show chats"
            title="Show chats"
          >
            <Menu size={20} />
          </button>
        )}

        {/* CHAT CONTAINER */}
        <div style={styles.chatContainer}>
          {/* CHAT HEADER */}
          <div style={styles.chatHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={fglogo_Wbg} alt="bot" style={{ height: 44 }} />
              <div>
                <div style={{ fontWeight: 700 }}>FinGenie Chatbot</div>
                <div style={{ fontSize: 12, color: "#556" }}>
                  {activeChat
                    ? `${activeChat.messages.length} messages`
                    : "No chat selected"}
                </div>
              </div>
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div ref={chatBodyRef} style={styles.chatBody}>
            {activeChat && activeChat.messages.length ? (
              activeChat.messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      ...styles.messageBubble,
                      background:
                        m.sender === "user" ? "#E5E5E5" : "#ffffff",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

                    {/* BUTTON ROW */}
                    <div style={styles.iconRow}>
                      {/* Copy always visible */}
                      <button
                        style={styles.iconBtn}
                        title="Copy"
                        aria-label="Copy message"
                        onClick={() =>
                          copyToClipboard(m.text, activeChat.id, idx)
                        }
                      >
                        {copiedMap[`${activeChat.id}_${idx}`] ? (
                          <span
                            style={{
                              fontSize: 14,
                              color: "green",
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>

                      {/* BOT ONLY → Like / Dislike / Share */}
                      {m.sender !== "user" && (
                        <>
                          <button
                            style={{
                              ...styles.iconBtn,
                              ...(m.liked ? styles.iconBtnActive : {}),
                            }}
                            title="Like"
                            aria-label="Like message"
                            onClick={() =>
                              toggleLike(activeChat.id, idx)
                            }
                          >
                            <ThumbsUp size={18} />
                          </button>

                          <button
                            style={{
                              ...styles.iconBtn,
                              ...(m.disliked ? styles.iconBtnDanger : {}),
                            }}
                            title="Dislike"
                            aria-label="Dislike message"
                            onClick={() =>
                              toggleDislike(activeChat.id, idx)
                            }
                          >
                            <ThumbsDown size={18} />
                          </button>

                          <button
                            style={styles.iconBtn}
                            title="Share"
                            aria-label="Share message"
                            onClick={() => shareText(m.text)}
                          >
                            <Share2 size={18} />
                          </button>
                        </>
                      )}

                      <div
                        style={{
                          marginLeft: 12,
                          fontSize: 11,
                          color: "#666",
                        }}
                      >
                        {fmtTime(m.ts)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, color: "#666" }}>
                No messages yet — start the conversation.
              </div>
            )}
          </div>

          {/* INPUT FIELD */}
          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask anything"
              aria-label="Chat input"
            />

            <button
              style={styles.sendButton}
              onClick={sendMessage}
              aria-label="Send message"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
/* --------------------------------
   STYLES (CLEANED)
-------------------------------- */
const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Montserrat','Inter',sans-serif",
    backgroundColor: "#F8F8F8",
    color: "#2d3748",
  },

  /* HEADER */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2rem 4rem",
    position: "relative",
    zIndex: 10,
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 8px 32px rgba(255,255,255,0.1)",
    borderBottom: "2px solid black",
  },

  headerLeft: { display: "flex", alignItems: "center" },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  nav: {
    display: "flex",
    gap: "1.5rem",
    marginTop: 10,
    alignItems: "center",
  },

  navLink: {
    cursor: "pointer",
    color: "#000",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
  },

  userMenu: { position: "relative", cursor: "pointer" },
  userIcon: { transition: "color 0.2s" },

  dropdown: {
    position: "absolute",
    right: 0,
    top: 32,
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    padding: "0.5rem",
    minWidth: 120,
    zIndex: 1000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },

  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem",
    cursor: "pointer",
    borderRadius: 4,
    fontSize: 14,
  },

  toolsMenu: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginLeft: "1rem",
  },

  /* MAIN LAYOUT */
  mainArea: {
    display: "flex",
    gap: "1rem",
    padding: "1rem",
    height: "calc(100vh - 120px)",
    boxSizing: "border-box",
  },

  /* SIDEBAR */
  sidebar: {
    width: 320,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: 10,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    boxSizing: "border-box",
  },

  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sidebarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#eee",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  sidebarShowButton: {
    width: 44,
    height: "100%",
    background: "#DCE5F5",
    border: "1px solid #ccc",
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  historyList: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
    flex: 1,
    paddingRight: 6,
  },

  historyItem: {
    padding: 12,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    border: "1px solid #eee",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },

  historyPreview: { fontSize: 13, color: "#111" },
  historyTime: { fontSize: 11, color: "#666", marginTop: 8 },

  historyDeleteBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
  },

  /* CHAT */
  chatContainer: {
    flex: 1,
    background: "white",
    borderRadius: 10,
    border: "1px solid #ccc",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  chatHeader: {
    display: "flex",
    alignItems: "center",
    padding: "1rem",
    background: "#DCE5F5",
    borderBottom: "1px solid #ccc",
  },

  chatBody: {
    padding: "1rem",
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    background: "#F7F7F7",
  },

  messageBubble: {
    padding: "0.75rem 1rem",
    borderRadius: 10,
    maxWidth: "75%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    lineHeight: 1.4,
  },

  iconRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "transparent",
    cursor: "pointer",
  },

  iconBtnActive: {
    background: "#e6fff2",
    borderColor: "#10b981",
  },

  iconBtnDanger: {
    background: "#fff0f0",
    borderColor: "#f87171",
  },

  /* INPUT */
  inputArea: {
    display: "flex",
    gap: 12,
    padding: "1rem",
    borderTop: "1px solid #e6e6e6",
  },

  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    fontSize: 14,
  },

  sendButton: {
    padding: "0.6rem 1rem",
    borderRadius: 8,
    border: "1px solid #cfcfcf",
    background: "#1d4ed8",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },

  /* FOOTER */
  footer: {
    backgroundColor: "#2d3748",
    color: "#e2e8f0",
    padding: "3rem",
    marginTop: "auto",
  },

  footerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "2rem",
  },

  footerLeft: { flex: 1 },

  footerLink: {
    color: "#81e6d9",
    textDecoration: "none",
  },

  footerRight: {
    flex: 1,
    maxWidth: 250,
  },

  functionsTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: "1rem",
  },

  functionsList: { listStyle: "none", padding: 0, margin: 0 },

  functionsItem: {
    fontSize: 14,
    marginBottom: "0.5rem",
    paddingLeft: "1rem",
    position: "relative",
  },
};
