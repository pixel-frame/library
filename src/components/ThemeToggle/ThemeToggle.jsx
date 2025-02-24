import { useTheme } from "../../hooks/useTheme";
import "./ThemeToggle.css";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      onKeyDown={(e) => e.key === "Enter" && toggleTheme()}
      className="theme-toggle font-mono"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      tabIndex={0}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
