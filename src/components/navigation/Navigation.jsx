import MobileMenu from "./MobileMenu";
import styles from "./Navigation.module.css";
import { RollingText } from "../text/RollingText";

const Navigation = () => {
  return (
    <nav className={styles.navigation}>
      <div className={styles.rollingTextWrapper}>
        <RollingText text="FROM LIQUID TO STONE | BIENNALE DE VENEZIA ARCHITTECTURA 2025 " />
      </div>
      <MobileMenu />
    </nav>
  );
};

export default Navigation;
