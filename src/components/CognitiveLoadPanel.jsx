import React from "react";

const CognitiveLoadPanel = () => {
  // Placeholder for the gauge/panel
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2em",
      border: "2px solid #eee",
      borderRadius: "1em",
      background: "#fafafa",
      minWidth: "300px"
    }}>
      <h2>Gauge</h2>
      <div style={{ fontSize: "2em", margin: "1em 0" }}>🔵</div>
      <p style={{ color: "#888" }}>[Cognitive Load Gauge Placeholder]</p>
    </div>
  );
};

export default CognitiveLoadPanel;
