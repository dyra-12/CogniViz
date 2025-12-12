// Placeholder utility for cognitive load hints

export function describeLoadState(loadState) {
  // Return a simple description based on loadState
  if (loadState === "high") return "High cognitive load detected.";
  if (loadState === "medium") return "Moderate cognitive load.";
  if (loadState === "low") return "Low cognitive load.";
  return "Unknown cognitive load state.";
}

export function getTaskInsights(taskData) {
  // Return top 3 factors as a placeholder
  return [
    "Factor 1: Complexity",
    "Factor 2: Time Pressure",
    "Factor 3: Information Overload"
  ];
}

/////////