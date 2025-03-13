const NetworkTab = ({ pixel }) => {
  return (
    <div className="other-data">
      <h2>Available Data</h2>
      <pre>{JSON.stringify(pixel, null, 2)}</pre>
    </div>
  );
};

export default NetworkTab;
