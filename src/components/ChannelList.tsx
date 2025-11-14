import { useEffect, useState } from "react";

interface Channel {
  id?: string;
  name?: string;
  Sk?: string;
  locked?: boolean;
}

interface ChannelListProps {
  token: string | null;
  onSelectChannel: (name: string) => void;
  currentChannel?: string;
}

export default function ChannelList({
  token,
  onSelectChannel,
  currentChannel,
}: ChannelListProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchChannels() {
    try {
      // 🚀 Same-origin request (Render + Local OK)
      const res = await fetch("/api/channels", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      let data: any = [];
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await res.json();
      }

            // Ensure array
      if (Array.isArray(data)) {
        // Extract channel names safely
        const cleaned = data.map((ch: any) => ({
          ...ch,
          name: ch.name || ch.Sk?.replace("channel#", ""),
        }));

        setChannels(cleaned);
      } else {
        setChannels([]);
      }

    } catch (err) {
      console.error("Error fetching channels:", err);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChannels();
  }, [token]);

  return (
    <div>
      <h3 className="section-header">Channels</h3>

      {loading ? (
        <p style={{ color: "#888", textAlign: "center" }}>Loading...</p>
      ) : channels.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center" }}>No channels found</p>
      ) : (
        channels.map((ch) => {
          const channelName = ch.name;

          if (!channelName) return null;

          const isActive = currentChannel === channelName;

          return (
            <div
              key={ch.id || ch.Sk || channelName}
              onClick={() => onSelectChannel(channelName)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                background: isActive ? "#ff6b00" : "white",
                color: isActive ? "white" : "#222",
                borderBottom: "1px solid #ddd",
                transition: "background 0.2s",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#ffe4cc";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "white";
              }}
            >
              <span>{channelName}</span>

              {/* 🔒 Locked channel icon */}
              {ch.locked && (
                <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>🔒</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
