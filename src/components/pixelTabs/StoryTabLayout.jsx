import styles from "./StoryTabLayout.module.css";

const StoryTabLayout = ({ emissionsGraph, logContainer, timeline }) => {
  return (
    <div className={styles.storyTabLayout}>
      <div className={styles.emissionsSection}>{emissionsGraph}</div>
      <div className={styles.logSection}>{logContainer}</div>
      <div className={styles.timelineSection}>{timeline}</div>
    </div>
  );
};

export default StoryTabLayout;
