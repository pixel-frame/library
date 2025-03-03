import React from "react";
import { RollingText } from "../text/RollingText";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.rollingTextWrapper}>
        <RollingText text="FROM LIQUID TO STONE | BIENNALE DE VENEZIA ARCHITTECTURA 2025 " />
      </div>
    </footer>
  );
};

export default Footer;
