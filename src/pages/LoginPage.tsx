import { useState } from "react";

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onContinueAsGuest: () => void;
  onLoginSuccess: () => void;
}

export default function LoginPage({
  onSwitchToRegister,
  onContinueAsGuest,
  onLoginSuccess,
}: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      //  calling backend via /api/auth/login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // reads JSON only if backend sent JSON
      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        const msg = data?.error
          ? Array.isArray(data.error)
            ? data.error.join(", ")
            : data.error
          : `Login failed (${res.status})`;

        setError(msg);
        return;
      }

      // Save JWT + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      onLoginSuccess();
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error while logging in");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Welcome to Chappy 💬</h2>
        <p>Login to chat — or join as a guest!</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>

          {error && <p className="error-message">{error}</p>}
        </form>

        <div className="switch">
          Don’t have an account?{" "}
          <span onClick={onSwitchToRegister}>Register here</span>
        </div>

        <hr style={{ margin: "1.5rem 0", border: "0.5px solid #ddd" }} />

        <button
          onClick={onContinueAsGuest}
          style={{
            backgroundColor: "#333",
            color: "white",
            border: "none",
            padding: "0.8rem 1rem",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            fontSize: "1rem",
            transition: "background 0.3s",
          }}
          onMouseOver={(e) =>
            ((e.target as HTMLButtonElement).style.backgroundColor = "#555")
          }
          onMouseOut={(e) =>
            ((e.target as HTMLButtonElement).style.backgroundColor = "#333")
          }
        >
          Continue as Guest 👋
        </button>
      </div>
    </div>
  );
}
