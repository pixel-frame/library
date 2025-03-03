import MobileMenu from "./MobileMenu";
import styles from "./Navigation.module.css";

const Navigation = () => {
  const navigationLinks = [
    { url: "/", label: "Home" },
    { url: "/assemblies", label: "Assemblies" },
    { url: "/privacy-policy", label: "Privacy Policy" },
  ];

  return (
    <nav className={styles.navigation}>
      <MobileMenu links={navigationLinks} />
    </nav>
  );
};

export default Navigation;
