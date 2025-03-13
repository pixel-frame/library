const StoryTab = ({ pixel }) => {
  if (!pixel.notes) return null;

  return (
    <div className="notes-section">
      <h2>Notes</h2>
      <p>{pixel.notes}</p>
    </div>
  );
};

export default StoryTab;
