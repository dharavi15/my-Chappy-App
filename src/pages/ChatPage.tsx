import { useEffect, useState } from "react";
import ChannelList from "../components/ChannelList";
import DmList from "../pages/DmList";

interface Message {
  id?: string;
  from?: string;
  sender?: string;
  to?: string;
  text?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
}

interface ChatPageProps {
  onLogout: () => void;
}

export default function ChatPage({ onLogout }: ChatPageProps) {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [currentChannel, setCurrentChannel] = useState<string>("General");
  const [currentDM, setCurrentDM] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // SWITCH CHANNEL
  function handleSelectChannel(name: string) {
    setCurrentDM(null);
    setCurrentChannel(name);
    setMessages([]);
  }

  // SWITCH DM
  function handleSelectDM(name: string) {
    setCurrentChannel("");
    setCurrentDM(name);
    setMessages([]);
  }

  // FETCH MESSAGES
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      setMessages([]);

      try {
        let url = "";

        if (currentDM) {
          url = `/api/dm/${currentDM}`;
        } else if (currentChannel) {
          url = `/api/messages/${currentChannel}`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const text = await res.text();
        let data: any = [];

        try {
          data = JSON.parse(text);
        } catch {
          console.warn("Invalid JSON:", text);
        }

        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, [currentChannel, currentDM, token]);

  // SEND MESSAGE
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      let url = "";
      let body: any = {};

      if (currentDM) {
        url = `/api/dm`;
        body = { toUser: currentDM, text: newMessage };
      } else {
        url = `/api/messages/${currentChannel}`;
        body = { text: newMessage };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Send failed:", await res.text());
        return;
      }

            const data = await res.json();
      const newMsg = data.messageItem || data;

      setMessages((prev) => [newMsg, ...prev]);
      setNewMessage("");

    } catch (err) {
      console.error("Send error:", err);
    }
  }

  return (
    <div className="chat-layout" style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div
        className="sidebar"
        style={{
          width: "280px",
          borderRight: "1px solid #ddd",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <ChannelList
          token={token}
          onSelectChannel={handleSelectChannel}
          currentChannel={currentChannel}
        />

        <h3 style={{ marginTop: "1.5rem" }}>Direct Messages</h3>

        {!token ? (
          <p style={{ color: "#999", fontStyle: "italic" }}>🔒 Login to see users</p>
        ) : (
          <DmList
            token={token}
            username={username || ""}
            currentDM={currentDM}
            onSelectDM={handleSelectDM}
          />
        )}
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2>
            💬 {currentDM ? `Direct Message to ${currentDM}` : `${currentChannel}`}
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontWeight: "bold", color: "#444" }}>
              👤 {username ? username : "Guest"}
            </span>

            <button
              onClick={onLogout}
              style={{
                background: "#ff6b00",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" style={{ flexGrow: 1, overflowY: "auto" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#777" }}>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#777" }}>No messages yet.</p>
          ) : (
            [...messages]
              .sort((a, b) => {
                const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
                const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
                return timeB - timeA;
              })
              .map((msg, index) => {
                const formattedTime = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div key={index} className="message" style={{ padding: "0.4rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontWeight: "bold" }}>
                        {msg.from || msg.sender}:
                        <span style={{ marginLeft: "6px", fontWeight: "normal" }}>
                          {msg.text || msg.content}
                        </span>
                      </div>

                      {formattedTime && (
                        <span style={{ fontSize: "0.8rem", color: "#777" }}>
                          {formattedTime}
                        </span>
                      )}
                    </div>

                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #eee",
                        margin: "0.3rem 0",
                      }}
                    />
                  </div>
                );
              })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={{ display: "flex", marginTop: "1rem" }}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              flexGrow: 1,
              padding: "0.6rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />
          <button
            type="submit"
            style={{
              marginLeft: "0.5rem",
              background: "#ff6b00",
              color: "white",
              border: "none",
              padding: "0.6rem 1rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
