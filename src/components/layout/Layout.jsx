import { useContext } from "react";
import { ThemeContext } from "../../contexts/ThemeContext";
import Navigation from "../navigation/Navigation";
import Footer from "../navigation/Footer";
import "./Layout.css";

const Layout = ({ children }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className="layout">
      <header>
        <Navigation />
      </header>
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
