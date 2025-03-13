import MobileMenu from "./MobileMenu";
import styles from "./Navigation.module.css";
import { RollingText } from "../text/RollingText";

const Navigation = () => {
  const navigationLinks = [
    { url: "/", label: "Home" },
    { url: "/assemblies", label: "Assemblies" },
    { url: "/pixels", label: "Pixels" },
    { url: "/privacy-policy", label: "Privacy Policy" },
  ];

  return (
    <nav className={styles.navigation}>
      <div className={styles.rollingTextWrapper}>
        <RollingText text="FROM LIQUID TO STONE | BIENNALE DE VENEZIA ARCHITTECTURA 2025 " />
      </div>
      <MobileMenu links={navigationLinks} />
    </nav>
  );
};

export default Navigation;
