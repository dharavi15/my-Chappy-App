import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";

type ViewType = "login" | "register" | "chat";

function App() {
  const [view, setView] = useState<ViewType>("login");

  // If token already exists → go to chat directly
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setView("chat");
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setView("login");
  }

  function handleContinueAsGuest() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setView("chat");
  }

  function handleLoginSuccess() {
    setView("chat");
  }

  return (
    <>
      {view === "login" && (
        <LoginPage
          onSwitchToRegister={() => setView("register")}
          onContinueAsGuest={handleContinueAsGuest}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {view === "register" && (
        <RegisterPage onSwitchToLogin={() => setView("login")} />
      )}

      {view === "chat" && <ChatPage onLogout={handleLogout} />}
    </>
  );
}

export default App;
