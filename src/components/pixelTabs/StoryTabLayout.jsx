import styles from "./StoryTabLayout.module.css";

const StoryTabLayout = ({ emissionsGraph, logContainer, timelinePosition }) => {
  return (
    <div className={styles.storyTabLayout}>
      <div className={styles.emissionsSection}>
        <div className={styles.timeIndicator} style={{ left: `${timelinePosition * 100}%` }} aria-hidden="true" />
        {emissionsGraph}
      </div>
      <div className={styles.logSection}>{logContainer}</div>
    </div>
  );
};

export default StoryTabLayout;
