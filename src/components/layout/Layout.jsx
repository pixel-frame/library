import { useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import MobileMenu from "../navigation/MobileMenu";
import "./Layout.css";

const Layout = ({ children }) => {
  const { theme } = useContext(ThemeContext);

  // Define navigation links
  const navigationLinks = [
    { url: "/", label: "Home" },
    { url: "/assemblies", label: "Assemblies" },
    { url: "/privacy-policy", label: "Privacy Policy" },
  ];

  return (
    <div className="layout">
      <header className="header">
        <MobileMenu links={navigationLinks} />
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;
