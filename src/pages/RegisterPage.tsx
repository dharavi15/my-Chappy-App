import { useState } from "react";
import type { FormEvent } from "react";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = Array.isArray(data.error)
          ? data.error.join(", ")
          : data.error || "Registration failed";

        setIsError(true);
        setMessage(msg);
        return;
      }

      // Success 🎉
      setIsError(false);
      setMessage("🎉 Registered successfully! Redirecting to login...");

      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);

    } catch (err) {
      console.error("Registration error:", err);
      setIsError(true);
      setMessage("Server error. Please try again.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>💬 Chappy</h2>
        <p>Create a new account to start chatting!</p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Register</button>

          {message && (
            <p
              className={isError ? "error-message" : "success-message"}
              style={{ marginTop: "0.8rem" }}
            >
              {message}
            </p>
          )}
        </form>

        <div className="switch">
          Already have an account?{" "}
          <span onClick={onSwitchToLogin}>Login here</span>
        </div>
      </div>
    </div>
  );
}
