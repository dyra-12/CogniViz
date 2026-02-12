# Dynamic Cognitive Load Estimation in CogniViz

> **Overview**: This document explains how cognitive load is calculated and displayed in real-time during the three tasks in the CogniViz study.

---

## What is Dynamic Cognitive Load?

Unlike the **NASA-TLX questionnaire** (filled out after each task), dynamic cognitive load provides **real-time feedback** during task execution based on how users interact with the interface.

### Two Measurement Approaches

| Approach | When | What It Measures |
|----------|------|------------------|
| **Dynamic Load** | During the task | Behavioral patterns (mouse movements, pauses, errors) |
| **NASA-TLX** | After the task | Self-reported workload across 6 dimensions |

Both methods complement each other: dynamic load captures objective behavior, while NASA-TLX captures subjective experience


---

## How It Works

### Simple Concept

```
User Actions → Behavior Tracking → Load Calculation → Visual Display
```

The system monitors how users interact with tasks and calculates a cognitive load level based on patterns like:
- ⏸️ Pauses and hesitation
- 🔄 Repeated actions or corrections  
- 🎯 Task efficiency
- ⚠️ Errors and constraint violations

---

## Three Load Levels

All tasks classify cognitive load into three levels:

| Level | Visual | Meaning |
|-------|--------|---------|
| **🟢 LOW** | Green gauge | Smooth, efficient interaction |
| **🟡 MEDIUM** | Orange gauge | Some difficulty or exploration |
| **🔴 HIGH** | Red gauge | Struggle with constraints or errors |

---

## Task 1: Form Entry

**What It Tracks**: How smoothly users complete the checkout form

### Key Signals
- **Idle Time**: Long pauses between field entries
- **Hesitation**: Delay before typing after clicking a field
- **Focus Time**: How long between switching fields
- **Efficiency**: Ratio of completed vs. focused fields

### Load Classification
- **LOW**: User moves through form smoothly with minimal pauses
- **MEDIUM**: User pauses for 5+ seconds, showing hesitation or confusion

**Example**: If user stops filling the form for 8 seconds, load switches to MEDIUM

---

## Task 2: Product Exploration

**What It Tracks**: Decision-making patterns during product search

### Key Signals
- **Exploration Breadth**: Number of products viewed and filters used
- **Hover Oscillations**: Rapid back-and-forth between same products
- **Filter Changes**: How often filters are adjusted
- **Decision Time**: Time to make final selection

### Load Classification
- **LOW**: User is decisive - views few products, applies 1-2 filters, selects quickly
- **MEDIUM**: User explores extensively, compares many products, adjusts filters repeatedly

**Example**: If user hovers rapidly between two products multiple times, this indicates decision uncertainty → MEDIUM load

---

## Task 3: Travel Planning

**What It Tracks**: Managing multiple constraints simultaneously (most complex task)

### Key Signals
- **Constraint Violations**: Breaking budget, time, or distance rules
- **Repeated Failures**: Multiple failed drag-and-drop attempts
- **Component Switching**: Jumping between tabs frequently
- **Recovery Speed**: How quickly violations are fixed

### Load Classification
- **LOW**: All constraints met, minimal violations
- **MEDIUM**: Active planning, some constraint awareness needed (default state)
- **HIGH**: Budget exceeded, multiple violations, repeated failed attempts

**Example**: User books flights + hotel that exceed €1,380 budget → HIGH load triggered

---

## Visual Feedback

Users see three real-time components:

### 1. Cognitive Load Gauge
- Circular gauge showing current load level
- Color changes: Green → Orange → Red
- Updates every few seconds

### 2. Explanation Banner
- Text explaining current load level
- Examples:
  - "Low cognitive load detected - smooth form progression"
  - "Moderate cognitive load - prolonged hesitation detected"
  - "High cognitive load due to budget overrun"

### 3. Top Contributing Factors
- List of 3-5 factors driving the current load
- Each factor shows:
  - Name (e.g., "Idle Time", "Decision Uncertainty")
  - Severity level
  - Brief description

---

## Key Differences Between Tasks

| Aspect | Task 1 | Task 2 | Task 3 |
|--------|--------|--------|--------|
| **Complexity** | Simple | Moderate | Complex |
| **Main Signal** | Idle time | Exploration patterns | Constraint violations |
| **Has HIGH Level?** | ❌ No | ❌ No | ✅ Yes |
| **Default State** | LOW | MEDIUM | MEDIUM |
| **Key Challenge** | Form completion flow | Decision-making | Multi-constraint management |

---

## Why This Matters for Research

1. **Objective Measurement**: Captures actual behavior, not just perception
2. **Real-Time Insights**: See when users struggle during the task
3. **Validation**: Compare dynamic estimates with NASA-TLX self-reports
4. **Intervention Potential**: Could trigger help when HIGH load detected
5. **UI Comparison**: Test if different designs reduce cognitive load

---

## Technical Notes

- **Update Rate**: Load recalculated every 250-500ms
- **Flicker Prevention**: Minimum 2-second delay between level changes
- **Data Retention**: Metrics use 60-second rolling windows
- **Storage**: Real-time calculations are not saved; only final NASA-TLX responses are stored

---

**Document Version**: 1.0  
**Last Updated**: February 13, 2026  

**Related**: See [STUDY_METRICS_DOCUMENTATION.md](STUDY_METRICS_DOCUMENTATION.md) for complete data collection details
