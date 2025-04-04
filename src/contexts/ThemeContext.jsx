import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      return savedTheme;
    }

    // if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    //   return "dark";
    // }

    return "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}
