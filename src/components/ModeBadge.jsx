import React from "react";
import PropTypes from "prop-types";

const ModeBadge = ({ mode }) => {
  // Default to "Simulation Mode" if no mode is provided
  const displayMode = mode || "Simulation Mode";
  return (
    <span style={{
      display: "inline-block",
      padding: "0.4em 1em",
      borderRadius: "1em",
      background: "orange",
      color: "white",
      fontWeight: "bold",
      fontSize: "1em"
    }}>
      🟠 {displayMode}
    </span>
  );
};

ModeBadge.propTypes = {
  mode: PropTypes.string
};

export default ModeBadge;
