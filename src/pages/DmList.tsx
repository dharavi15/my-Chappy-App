import { useEffect, useState } from "react";

interface DMListProps {
  token: string | null;
  username: string;
  currentDM: string | null;
  onSelectDM: (name: string) => void;
}

export default function DMList({
  token,
  username,
  currentDM,
  onSelectDM,
}: DMListProps) {
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      if (!token) return; // guest cannot view DM list

      try {
        // Always same-origin call
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data: any = [];
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        }

        if (res.ok && Array.isArray(data)) {
          const list = data
            .map((u: any) => u.username)
            .filter((name: string) => name && name !== username);

          setUsers(list);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsers([]);
      }
    }

    fetchUsers();
  }, [token, username]);

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {users.length === 0 ? (
        <p style={{ color: "#999", fontStyle: "italic" }}>
          No other users yet
        </p>
      ) : (
        users.map((user) => {
          const isActive = currentDM === user;

          return (
            <div
              key={user}
              onClick={() => onSelectDM(user)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                background: isActive ? "#ff6b00" : "white",
                color: isActive ? "white" : "#222",
                borderBottom: "1px solid #ddd",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#ffe4cc";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "white";
              }}
            >
              {user}
            </div>
          );
        })
      )}
    </div>
  );
}
