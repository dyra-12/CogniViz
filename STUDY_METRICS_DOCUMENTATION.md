# CogniViz Study: Metrics & Data Collection Documentation

> **Purpose**: This document provides a comprehensive guide to the metrics collected, data structures, and analysis approach for the CogniViz cognitive workload research study.

---

## 📋 Table of Contents

1. [Study Overview](#study-overview)
2. [Study Flow](#study-flow)
3. [Task Descriptions](#task-descriptions)
4. [Metrics Collected](#metrics-collected)
5. [NASA-TLX Questionnaire](#nasa-tlx-questionnaire)
6. [Data Storage & Flow](#data-storage--flow)
7. [Key Files Reference](#key-files-reference)
8. [Usage for Researchers](#usage-for-researchers)
9. [Technical Notes](#technical-notes)

---

## Study Overview

**CogniViz** is a web-based cognitive workload research application that measures both objective performance metrics and subjective workload across three distinct interactive tasks.

### What We Measure

- **Objective Metrics**: Task completion time, error rates, mouse movements, interaction patterns
- **Subjective Metrics**: NASA-TLX questionnaire responses after each task
- **Behavioral Signals**: Decision-making patterns, hesitations, constraint violations

### Data Pipeline

```
User Interaction → Browser (localStorage) → Completion → Firebase Firestore
```

All metrics are collected in real-time, stored locally in the browser's `localStorage`, then aggregated and uploaded to Firebase Firestore upon study completion.

---

## Study Flow

### Complete Participant Journey

```
┌─────────────────────┐
│ 1. Consent Landing  │ → Participant reads and accepts consent form
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 2. Task 1: Forms    │ → E-commerce checkout form (billing/shipping)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 3. NASA-TLX #1      │ → Rate cognitive load (6 dimensions)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 4. Task 2: Products │ → Filter and compare products
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 5. NASA-TLX #2      │ → Rate cognitive load (6 dimensions)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 6. Task 3: Travel   │ → Multi-component planning with constraints
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 7. NASA-TLX #3      │ → Rate cognitive load (6 dimensions)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ 8. Completion Page  │ → Automatic data upload to Firestore
└─────────────────────┘
```

**Total Duration**: Approximately 20-30 minutes


---

## Task Descriptions

### 🗂️ Task 1: Data Entry Form

**Primary Goal**: Complete a checkout form with billing and shipping information

**Cognitive Challenges**:
- Form navigation and field completion
- Data validation and error handling
- Information recall and entry accuracy
- Multi-field coordination

**User Actions Measured**:
- ✅ Fill billing and shipping information (name, email, address, etc.)
- ✅ Select shipping method
- ✅ Handle validation errors
- ✅ Navigate between form fields

**Logging Implementation**: [`useTask1Logger`](src/hooks/useTask1Logger.js)

---

### 🔍 Task 2: Product Exploration & Filtering

**Primary Goal**: Use filters to find and select products matching criteria

**Cognitive Challenges**:
- Information filtering and sorting
- Multiple option comparison
- Decision-making under choice overload
- Visual search and pattern matching

**User Actions Measured**:
- ✅ Apply price, category, and brand filters
- ✅ Hover over products to view details
- ✅ Compare multiple products
- ✅ Make final selection

**Logging Implementation**: [`useTask2Logger`](src/hooks/useTask2Logger.js)

---

### ✈️ Task 3: Travel Planning (Most Complex)

**Primary Goal**: Plan a business trip within budget and time constraints

**Cognitive Challenges**:
- Multi-component task coordination (5 sub-tasks)
- Budget management (€1,380 limit)
- Constraint satisfaction (time/distance rules)
- Scheduling and conflict resolution

**Components & Constraints**:

| Component | Constraint | Limit |
|-----------|-----------|-------|
| **Flights (Outbound)** | Arrival time | Must arrive before 15:00 |
| **Flights (Return)** | Departure time | ≥ 12:00, arrival next day |
| **Hotel** | Distance from center | Within 5 km |
| **Budget** | Total spending | ≤ €1,380 |
| **Meetings** | Scheduling | No time conflicts allowed |
| **Transportation** | Mode selection | One-time choice |

**User Actions Measured**:
- ✅ Book outbound and return flights
- ✅ Select hotel within distance constraint
- ✅ Choose ground transportation
- ✅ Schedule 4 meetings via drag-and-drop
- ✅ Manage total budget

**Logging Implementation**: [`useTask3Logger`](src/hooks/useTask3Logger.js)


---

## Metrics Collected

> **Note**: All timestamps are in ISO 8601 format (e.g., `2025-11-12T14:30:00.123Z`)

### Overview of Metric Categories

| Category | Task 1 | Task 2 | Task 3 |
|----------|--------|--------|--------|
| **Timing** | ✅ Start, end, duration | ✅ Start, end, duration | ✅ Start, end, duration |
| **Success** | ✅ Completion, errors | ✅ Completion, errors | ✅ Completion, errors |
| **Mouse Activity** | ✅ Events, coordinates | ✅ Entropy, precision | ✅ Entropy per component |
| **Interactions** | ✅ Field-level tracking | ✅ Filter usage | ✅ Multi-component actions |
| **Decision Patterns** | ✅ Edit counts | ✅ Comparison behavior | ✅ Rapid changes |
| **Task-Specific** | ✅ Form validation | ✅ Product hovers | ✅ Budget/constraints |

---

### 📊 Task 1 Metrics Structure

<details>
<summary><strong>View Complete JSON Structure</strong></summary>

```json
{
  "task_1_data": {
    "timestamps": {
      "start": "2025-11-12T14:30:00.123Z",
      "end": "2025-11-12T14:35:45.678Z"
    },
    "summary_metrics": {
      "total_time_ms": 345555,
      "success": true,
      "error_count": 2,
      "help_requests": 1
    },
    "field_interactions": [
      {
        "field_name": "firstName",
        "focus_time_ms": 4500,
        "backspace_count": 3,
        "edit_count": 2
      },
      {
        "field_name": "email",
        "focus_time_ms": 8200,
        "backspace_count": 7,
        "edit_count": 4
      },
      {
        "field_name": "zipCode",
        "focus_time_ms": 6100,
        "backspace_count": 2,
        "edit_count": 3
      }
    ],
    "mouse_data": [
      {
        "type": "mousemove",
        "timestamp": "2025-11-12T14:30:05.123Z",
        "target": "INPUT",
        "coordinates": { "x": 450, "y": 320 }
      },
      {
        "type": "mousedown",
        "timestamp": "2025-11-12T14:30:06.456Z",
        "target": "button-submit",
        "coordinates": { "x": 520, "y": 680 }
      },
      {
        "type": "keydown",
        "timestamp": "2025-11-12T14:30:07.789Z",
        "target": "INPUT",
        "key": "Backspace"
      }
    ],
    "task_specific_metrics": {
      "zip_code_corrections": 2,
      "shipping_method_changes": 1,
      "field_sequence": ["firstName", "lastName", "email", "phone", "address", "city", "zipCode", "country", "shippingMethod"]
    }
  }
}
```

</details>

#### Key Metrics Explained

| Metric | Description | Analysis Use |
|--------|-------------|--------------|
| **`total_time_ms`** | Task completion time | Performance benchmark |
| **`success`** | Task completed successfully | Completion rate |
| **`error_count`** | Validation errors encountered | Error proneness |
| **`field_interactions`** | Per-field focus time, edits, backspaces | Navigation patterns |
| **`mouse_data`** | Raw event logs (throttled 100ms) | Movement analysis |
| **`zip_code_corrections`** | Specific field edit count | Data entry difficulty |
| **`field_sequence`** | Order fields were accessed | Strategy analysis |

**Cognitive Load Indicators**:
- High `backspace_count` → typing errors, uncertainty
- High `edit_count` → field revisiting, corrections
- Long `focus_time_ms` → difficulty or hesitation

---

### 📊 Task 2 Metrics Structure

<details>
<summary><strong>View Complete JSON Structure</strong></summary>

```json
{
  "task_2_data": {
    "timestamps": {
      "start": "2025-11-12T14:40:00.123Z",
      "end": "2025-11-12T14:48:30.456Z"
    },
    "summary_metrics": {
      "total_time_ms": 510333,
      "success": true,
      "error_count": 0
    },
    "filter_interactions": {
      "filter_uses": [
        {
          "filter_type": "price",
          "action": "set",
          "value_before": null,
          "value_after": { "min": 0, "max": 500 },
          "timestamp": "2025-11-12T14:40:15.123Z"
        },
        {
          "filter_type": "category",
          "action": "set",
          "value_before": null,
          "value_after": "Electronics",
          "timestamp": "2025-11-12T14:40:25.456Z"
        }
      ],
      "filter_sequence": ["price", "category", "brand"],
      "filter_resets": 2
    },
    "product_exploration": {
      "products_viewed": [
        {
          "product_id": "prod_123",
          "hover_duration_ms": 3400
        },
        {
          "product_id": "prod_456",
          "hover_duration_ms": 5200
        }
      ],
      "rapid_hover_switches": 3
    },
    "decision_making": {
      "time_to_first_filter": 15000,
      "decision_time_ms": 8500,
      "comparison_count": 12
    },
    "mouse_analytics": {
      "mouse_entropy": 2.456,
      "click_precision": [
        {
          "target": "product-card",
          "click_pos": { "x": 520, "y": 340 },
          "center_pos": { "x": 525, "y": 345 },
          "distance": 7.07
        }
      ]
    }
  }
}
```

</details>

#### Key Metrics Explained

| Metric | Description | Analysis Use |
|--------|-------------|--------------|
| **`filter_uses`** | Complete filter history | Filter strategy analysis |
| **`filter_sequence`** | Order of filter types applied | Decision approach |
| **`filter_resets`** | Times all filters cleared | Strategy changes |
| **`products_viewed`** | Hover events with duration | Information gathering |
| **`rapid_hover_switches`** | Fast product switches (<500ms) | Decision uncertainty |
| **`time_to_first_filter`** | Delay before first filter | Initial strategy formation |
| **`decision_time_ms`** | Time from last filter to completion | Final decision duration |
| **`mouse_entropy`** | Movement complexity score | Cognitive effort indicator |
| **`click_precision`** | Distance from target center | Motor control |

**Cognitive Load Indicators**:
- High `rapid_hover_switches` → indecision, comparison difficulty
- High `mouse_entropy` → erratic movement, searching behavior
- Multiple `filter_resets` → strategy exploration or confusion
- Long `decision_time_ms` → difficulty making final choice

---

### 📊 Task 3 Metrics Structure

<details>
<summary><strong>View Complete JSON Structure</strong></summary>

```json
{
  "session_id": "a1b2c3d4-e5f6-4789-a012-3456789abcde",
  "task": "task3",
  "start_time": "2025-11-12T14:50:00.123Z",
  "end_time": "2025-11-12T15:05:30.456Z",
  "success": true,
  "error_count": 1,
  "completed": true,
  "last_saved_ts": "2025-11-12T15:05:30.456Z",
  "total_actions": 47,
  "component_switches": [
    {
      "tab": "flights",
      "ts": "2025-11-12T14:50:15.123Z"
    },
    {
      "tab": "hotels",
      "ts": "2025-11-12T14:52:30.456Z"
    },
    {
      "tab": "meetings",
      "ts": "2025-11-12T14:58:10.789Z"
    }
  ],
  "idle_periods": [
    {
      "start": "2025-11-12T14:53:00.000Z",
      "end": "2025-11-12T14:53:08.500Z",
      "duration_ms": 8500
    }
  ],
  "computed_signals": {
    "rapid_selection_changes": 2,
    "mouse_sampling_rate_ms": 100
  },
  "budget": {
    "current_total": 1320,
    "updates": [
      {
        "ts": "2025-11-12T14:51:00.123Z",
        "new_total": 450,
        "cause": "flight",
        "detail": {
          "flight_id": "FL_001",
          "price": 450
        }
      },
      {
        "ts": "2025-11-12T14:52:45.456Z",
        "new_total": 900,
        "cause": "hotel",
        "detail": {
          "hotel_id": "HT_123",
          "price": 450
        }
      },
      {
        "ts": "2025-11-12T14:53:20.789Z",
        "new_total": 1420,
        "cause": "flight",
        "detail": {
          "flight_id": "FL_002",
          "price": 520
        }
      },
      {
        "ts": "2025-11-12T14:54:10.012Z",
        "new_total": 1320,
        "cause": "flight",
        "detail": {
          "flight_id": "FL_003",
          "price": 420
        }
      }
    ],
    "budget_overrun_events": 1,
    "cost_adjustment_actions": 1,
    "in_overrun": false,
    "overrun_selection_counter": 0
  },
  "flights": {
    "hover_events": [
      {
        "flight_id": "FL_001",
        "flight_name": "Lufthansa FL_001",
        "start_ts": "2025-11-12T14:50:30.123Z",
        "end_ts": "2025-11-12T14:50:35.456Z",
        "duration_ms": 5333
      }
    ],
    "selections": [
      {
        "ts": "2025-11-12T14:51:00.123Z",
        "flight_id": "FL_001",
        "flight_name": "Lufthansa FL_001",
        "direction": "outbound",
        "airline": "Lufthansa",
        "dep_time": "2025-11-20T08:00:00.000Z",
        "arr_time": "2025-11-20T12:30:00.000Z",
        "price": 450,
        "follows_rules": true
      },
      {
        "ts": "2025-11-12T14:53:20.789Z",
        "flight_id": "FL_002",
        "flight_name": "Air France FL_002",
        "direction": "return",
        "airline": "Air France",
        "dep_time": "2025-11-27T14:00:00.000Z",
        "arr_time": "2025-11-28T02:30:00.000Z",
        "price": 520,
        "follows_rules": true
      }
    ],
    "mouse_entropy": 1.847
  },
  "hotels": {
    "hover_events": [
      {
        "hotel_id": "HT_123",
        "hotel_name": "Grand Hotel Berlin",
        "start_ts": "2025-11-12T14:52:20.123Z",
        "end_ts": "2025-11-12T14:52:28.456Z",
        "duration_ms": 8333
      }
    ],
    "selections": [
      {
        "ts": "2025-11-12T14:52:45.456Z",
        "hotel_id": "HT_123",
        "hotel_name": "Grand Hotel Berlin",
        "stars": 4,
        "distance_km": 3.2,
        "price": 450,
        "within_5km": true,
        "booked_finally": false
      }
    ],
    "mouse_entropy": 1.623
  },
  "transportation": {
    "hover_events": [],
    "selections": [
      {
        "ts": "2025-11-12T14:55:10.789Z",
        "mode": "Train",
        "price": 120
      }
    ],
    "mouse_entropy": 0.892
  },
  "meetings": {
    "drag_attempts": [
      {
        "meeting_id": "MTG_001",
        "attempts": [
          {
            "start_ts": "2025-11-12T14:58:30.123Z",
            "attempted_slot": "Monday 09:00",
            "valid": false,
            "reason": "Conflict with existing meeting",
            "duration_ms": 2100
          },
          {
            "start_ts": "2025-11-12T14:58:35.456Z",
            "attempted_slot": "Monday 10:00",
            "valid": true,
            "reason": null,
            "duration_ms": 1800
          }
        ],
        "placement_duration_ms": 5300,
        "final_slot": "Monday 10:00",
        "placed": true
      }
    ],
    "mouse_entropy": 2.134
  },
  "computed": {
    "rapid_selection_buffer": []
  },
  "internal_errors": []
}
```

```

</details>

#### Key Metrics Explained

**General Metrics**:

| Metric | Description | Analysis Use |
|--------|-------------|--------------|
| **`session_id`** | Unique task session identifier | Data correlation |
| **`total_actions`** | Count of all user actions | Activity level |
| **`component_switches`** | Tab navigation log | Task switching behavior |
| **`idle_periods`** | Inactivity >3 seconds | Hesitation, confusion |

**Budget Management**:

| Metric | Description | Analysis Use |
|--------|-------------|--------------|
| **`current_total`** | Final total cost (€) | Budget adherence |
| **`updates`** | History of cost changes | Budget monitoring |
| **`budget_overrun_events`** | Times exceeded €1,380 | Constraint violations |
| **`cost_adjustment_actions`** | Corrections after overrun | Error recovery |
| **`overrun_selection_counter`** | Selections while over budget | Risk-taking behavior |

**Component-Specific Tracking**:

| Component | Hover Events | Selections | Constraints Validated |
|-----------|--------------|------------|----------------------|
| **Flights** | ✅ Duration logged | ✅ Time constraints | Arrival/departure rules |
| **Hotels** | ✅ Duration logged | ✅ Distance constraint | Within 5km of center |
| **Transportation** | ✅ Duration logged | ✅ Price tracking | N/A |
| **Meetings** | N/A | ✅ Drag attempts | Conflict detection |

**Mouse Entropy**: Calculated separately for each component area to measure complexity of interactions in different contexts.

**Meeting Drag-and-Drop**:
- **`drag_attempts`**: Complete log of all drag-and-drop attempts
- **`attempts`**: Each drop attempt with validation result and reason for failure
- **`placement_duration_ms`**: Total time to successfully place each meeting
- **`valid`**: Whether attempted slot was valid or had conflicts

**Constraint Validation**:
- Flight `follows_rules`: Validates time constraints automatically
- Hotel `within_5km`: Checks distance from city center
- Meeting `valid`: Checks for scheduling conflicts

**Cognitive Load Indicators**:
- Multiple `budget_overrun_events` → difficulty tracking constraints
- Long `idle_periods` → confusion or indecision
- Many `component_switches` → task switching overhead
- Failed `drag_attempts` → spatial reasoning difficulty
- High `overrun_selection_counter` → ignoring constraints

---

## NASA-TLX Questionnaire

### What is NASA-TLX?

The **NASA Task Load Index (NASA-TLX)** is a validated, multidimensional assessment tool widely used in human factors research to measure **subjective workload**. 

**Implementation**: We use the simplified NASA-TLX method with equal weighting (no pairwise comparisons).

---

### The Six Dimensions of Cognitive Load

Each dimension is rated independently on a **5-point scale** (10, 30, 50, 70, 90):

| Dimension | Question | What It Measures |
|-----------|----------|------------------|
| **🧠 Mental Demand** | How much thinking, deciding, or remembering did the task require? | Cognitive processing requirements |
| **💪 Physical Demand** | How much physical effort was involved? (clicking, typing, mouse) | Motor activity and physical strain |
| **⏱️ Temporal Demand** | How much time pressure did you feel? | Perceived time constraints |
| **✅ Performance** | How successful were you in accomplishing the task? | Self-assessed effectiveness |
| **⚡ Effort** | How hard did you work to achieve your performance level? | Overall exertion |
| **😤 Frustration** | How insecure, discouraged, or annoyed did you feel? | Emotional response |

---

### Rating Scale

Each dimension uses descriptive labels for clarity:

| Score | Range | Label | Interpretation |
|-------|-------|-------|----------------|
| **10** | 0-20 | Very Low / Very Easy | Minimal demand |
| **30** | 21-40 | Low / Simple | Below average demand |
| **50** | 41-60 | Moderate | Average demand |
| **70** | 61-80 | High / Challenging | Above average demand |
| **90** | 81-100 | Very High / Extremely Demanding | Maximum demand |

---

### Randomization

Questions are **randomized for each participant** using the Fisher-Yates shuffle algorithm to prevent:
- Order effects
- Response bias
- Learning effects across multiple questionnaires

---

### Data Structure

```json
{
  "task_id": "task_1_form",
  "nasa_tlx_scores": {
    "mental_demand": 70,
    "physical_demand": 30,
    "temporal_demand": 50,
    "performance": 70,
    "effort": 50,
    "frustration": 30
  },
  "raw_tlx_score": 50.0,
  "timestamp": "2025-11-12T14:36:00.123Z"
}
```

#### Fields Explained

| Field | Description | Example Value |
|-------|-------------|---------------|
| **`task_id`** | Task identifier | `"task_1_form"`, `"task_2_form"`, `"task_3_form"` |
| **`nasa_tlx_scores`** | Six dimension scores | Object with 6 properties (values: 10/30/50/70/90) |
| **`raw_tlx_score`** | Average of all six scores | Range: 10-90, rounded to 1 decimal |
| **`timestamp`** | Submission time | ISO 8601 format |

#### Scoring Formula

```javascript
raw_tlx_score = (mental_demand + physical_demand + temporal_demand + 
                 performance + effort + frustration) / 6
```

**Example**: If all scores are 50, the `raw_tlx_score` = 50.0 (moderate workload)

**Interpretation**:
- **10-30**: Low cognitive load
- **30-50**: Below-average to moderate load
- **50-70**: Moderate to high load
- **70-90**: High to very high load


---

## Data Storage & Flow

### 💾 LocalStorage Keys

All data is initially stored in the browser's `localStorage` before final upload.

#### Task Performance Data

| Key | Content | When Saved |
|-----|---------|------------|
| `task_1_data` | Task 1 complete metrics | After Task 1 completion |
| `task_2_data` | Task 2 complete metrics | After Task 2 completion |
| `task3_metrics_{sessionId}` | Task 3 complete metrics | After Task 3 completion |

#### NASA-TLX Responses

| Key | Content | When Saved |
|-----|---------|------------|
| `nasa_tlx_task_1_form` | Task 1 questionnaire | After TLX #1 submission |
| `nasa_tlx_task_2_form` | Task 2 questionnaire | After TLX #2 submission |
| `nasa_tlx_task_3_form` | Task 3 questionnaire | After TLX #3 submission |
| `nasa_tlx_responses` | Array of all TLX responses | After each TLX submission |

#### Session Management

| Key | Content | Purpose |
|-----|---------|---------|
| `participantId` | Anonymous participant ID | User identification |
| `consentGiven` | Boolean | Consent tracking |
| `taskProgress` | Current/completed tasks | Progress tracking |

#### Upload Tracking (Deduplication)

| Key | Content | Purpose |
|-----|---------|---------|
| `submission_sent` | Boolean flag | Prevent duplicate aggregated uploads |
| `submission_docId` | Firestore document ID | Track aggregated submission |
| `task1_uploaded` | Boolean flag | Prevent duplicate Task 1 uploads |
| `task1_docId` | Firestore document ID | Track Task 1 submission |

---

### 🔄 Complete Data Flow Sequence

```
┌──────────────────────────────────────────────────────────────┐
│ TASK 1: FORM ENTRY                                           │
├──────────────────────────────────────────────────────────────┤
│ 1. User starts task                                          │
│    └─> useTask1Logger.markStart()                           │
│        └─> Initializes start timestamp                      │
│                                                              │
│ 2. User interacts with form                                  │
│    └─> Field focus/blur/change events captured              │
│    └─> Mouse and keyboard events logged (throttled)         │
│    └─> Validation errors counted                            │
│                                                              │
│ 3. User completes task                                       │
│    └─> useTask1Logger.markEnd()                             │
│        └─> Calculates total duration                        │
│    └─> useTask1Logger.saveToLocalStorage()                  │
│        └─> Saves to 'task_1_data' key                       │
├──────────────────────────────────────────────────────────────┤
│ NASA-TLX QUESTIONNAIRE #1                                    │
├──────────────────────────────────────────────────────────────┤
│ 4. Questionnaire appears                                     │
│    └─> 6 questions displayed (randomized order)             │
│    └─> User rates each dimension (10/30/50/70/90)          │
│    └─> On submit:                                            │
│        └─> saveQuestionnaireResponse('task_1_form', scores) │
│        └─> Saves to 'nasa_tlx_task_1_form'                  │
│        └─> Appends to 'nasa_tlx_responses' array            │
└──────────────────────────────────────────────────────────────┘

[Same pattern repeats for Task 2 and Task 3]

┌──────────────────────────────────────────────────────────────┐
│ COMPLETION PAGE: DATA UPLOAD                                 │
├──────────────────────────────────────────────────────────────┤
│ 1. User reaches completion page                              │
│    └─> Check if 'submission_sent' is true                   │
│        └─> If true: Skip upload (already done)              │
│        └─> If false: Proceed with upload                    │
│                                                              │
│ 2. Build aggregated payload                                  │
│    └─> buildAggregatedStudyPayload()                         │
│        └─> Collects all task data from localStorage         │
│        └─> Collects all NASA-TLX responses                  │
│        └─> Adds metadata (participantId, timestamp)         │
│                                                              │
│ 3. Upload to Firestore                                       │
│    └─> sendAggregatedStudyData(payload)                     │
│        └─> Uploads to 'study_responses' collection          │
│        └─> Returns document ID                              │
│    └─> Set 'submission_sent' = true                         │
│    └─> Set 'submission_docId' = returned ID                 │
│                                                              │
│ 4. Confirmation displayed to user                            │
│    └─> Option to download personal data copy                │
└──────────────────────────────────────────────────────────────┘
```

---

### 📦 Aggregated Payload Structure

When all tasks are complete, the following structure is uploaded to Firestore:

```json
{
  "id": "abc123xyz789",
  "participantId": "anon_user_456",
  "timestamp": "2025-11-12T15:10:00.123Z",
  "task_metrics": {
    "task_1": { /* Task 1 full data structure */ },
    "task_2": { /* Task 2 full data structure */ },
    "task_3": { /* Task 3 full data structure */ }
  },
  "nasa_tlx_responses": [
    { /* Task 1 TLX response */ },
    { /* Task 2 TLX response */ },
    { /* Task 3 TLX response */ }
  ],
  "meta": {
    "app": "CogniViz",
    "version": null
  }
}
```

#### Payload Structure Explanation

| Field | Description | Content |
|-------|-------------|---------|
| **`id`** | Unique document identifier | Auto-generated unique string |
| **`participantId`** | Anonymous participant ID | E.g., `"anon_user_456"` |
| **`timestamp`** | Upload time | ISO 8601 format |
| **`task_metrics`** | All task performance data | Nested object with task_1, task_2, task_3 |
| **`nasa_tlx_responses`** | All questionnaire responses | Array of 3 TLX objects |
| **`meta`** | Application metadata | App name and version |

---

### 🗄️ Firestore Collections

#### Collection: `study_responses`

**Purpose**: Complete participant data for analysis

| Field | Content |
|-------|---------|
| **Documents** | One per participant/session |
| **Structure** | Aggregated payload (shown above) |
| **Use Case** | Primary data source for study analysis |

#### Collection: `task1` (Optional)

**Purpose**: Task 1 specific analysis

| Field | Content |
|-------|---------|
| **Documents** | Task 1 metrics only |
| **Upload Method** | `sendTask1Metrics()` |
| **Use Case** | Isolated Task 1 research or A/B testing |


---

## Key Files Reference

### 📂 File Organization

#### UI Components

| File | Purpose | Key Features |
|------|---------|--------------|
| [QuestionnaireModal.jsx](src/components/QuestionnaireModal.jsx) | NASA-TLX questionnaire UI | 6 questions, randomization, validation |
| [CognitiveLoadGauge.jsx](src/components/CognitiveLoadGauge.jsx) | Real-time load visualization | Visual feedback during tasks |
| [ExplanationBanner.jsx](src/components/ExplanationBanner.jsx) | Task instructions | Context for each task |

#### Data Collection Hooks

| File | Purpose | Tracks |
|------|---------|--------|
| [useTask1Logger.js](src/hooks/useTask1Logger.js) | Task 1 metrics | Form interactions, field navigation, validation |
| [useTask2Logger.js](src/hooks/useTask2Logger.js) | Task 2 metrics | Filters, product hovers, decision patterns |
| [useTask3Logger.js](src/hooks/useTask3Logger.js) | Task 3 metrics | Multi-component actions, budget, constraints |

#### Utility Functions

| File | Purpose | Functions |
|------|---------|-----------|
| [tlx.js](src/utils/tlx.js) | NASA-TLX operations | Scoring, storage, retrieval |
| [dataCollection.js](src/utils/dataCollection.js) | Data aggregation & upload | Firestore integration |
| [firebase.js](src/utils/firebase.js) | Firebase setup | Configuration, initialization |

#### Context Providers

| File | Purpose | Manages |
|------|---------|---------|
| [TaskProgressContext.jsx](src/contexts/TaskProgressContext.jsx) | Task orchestration | Flow control, questionnaire triggering |
| [CognitiveLoadContext.jsx](src/contexts/CognitiveLoadContext.jsx) | Load tracking | Real-time cognitive load estimation |
| [AuthContext.jsx](src/contexts/AuthContext.jsx) | Participant management | Anonymous authentication |

#### Task Implementation Pages

| File | Purpose | Task Type |
|------|---------|-----------|
| [Task1.jsx](src/pages/Task1.jsx) | Form entry task | Billing/shipping form |
| [Task2.jsx](src/pages/Task2.jsx) | Product exploration | Filter & compare products |
| [Task3.jsx](src/pages/Task3.jsx) | Travel planning | Multi-component with constraints |
| [CompletionPage.jsx](src/pages/CompletionPage.jsx) | Study completion | Data upload & thank you |

---

## Usage for Researchers

### 📊 Accessing Participant Data

#### Method 1: Firestore Console

1. Navigate to Firebase Console → Firestore Database
2. Open `study_responses` collection
3. Each document = one participant's complete data
4. Filter/query by:
   - `timestamp`: Date range
   - `participantId`: Specific participant
   - `task_metrics.*.success`: Completion status

#### Method 2: Participant Download

- Participants can download their data as JSON from the Completion Page
- Contains identical structure to Firestore document
- Useful for transparency and participant data rights

#### Method 3: Programmatic Export

```javascript
// Example: Export all responses
const snapshot = await db.collection('study_responses').get();
const data = snapshot.docs.map(doc => doc.data());
```

---

### 🔬 Analyzing Metrics

#### Performance Metrics

| Metric | What It Measures | Analysis Approach |
|--------|------------------|-------------------|
| `total_time_ms` | Task completion speed | Mean, median, distribution |
| `success` | Completion rate | Percentage by task |
| `error_count` | Mistake frequency | Sum, average per task |

#### Cognitive Load Indicators

| Indicator | Signal | Interpretation |
|-----------|--------|----------------|
| **NASA-TLX Score** | Self-reported workload | Direct load measure |
| **Mouse Entropy** | Movement complexity | Indirect load indicator |
| **Idle Periods** | Hesitation count/duration | Confusion or decision difficulty |
| **Rapid Changes** | Quick selection switches | Uncertainty, comparison difficulty |
| **Edit/Backspace Count** | Typing corrections | Data entry difficulty |

#### Task-Specific Analysis

**Task 1 - Form Entry**:
- `field_sequence`: Navigation strategy (linear vs. jumping)
- `focus_time_ms` per field: Which fields are difficult
- `backspace_count`: Typing accuracy by field
- `shipping_method_changes`: Decision revision

**Task 2 - Product Filtering**:
- `filter_sequence`: Filter application strategy
- `time_to_first_filter`: Initial planning time
- `products_viewed`: Information gathering breadth
- `rapid_hover_switches`: Comparison difficulty
- `decision_time_ms`: Final decision duration

**Task 3 - Travel Planning**:
- `component_switches`: Task switching frequency
- `budget_overrun_events`: Constraint tracking difficulty
- `drag_attempts.attempts`: Spatial reasoning challenges
- `idle_periods`: Multi-component coordination difficulty
- Constraint violations: Rule comprehension

---

### 📈 Sample Analysis Questions

#### Performance Analysis
- Which task has the longest completion time?
- What is the error rate by task?
- How many participants violate budget constraints?

#### Cognitive Load Analysis
- Does NASA-TLX score correlate with task completion time?
- Is mouse entropy higher in Task 3 (most complex)?
- Do participants with more idle periods report higher frustration?

#### Behavioral Pattern Analysis
- What filter strategies are most common in Task 2?
- Do rapid selection changes predict higher TLX scores?
- How do constraint violations relate to budget management?

---

### 🔒 Privacy & Ethics

#### Data Protection

| Aspect | Implementation |
|--------|---------------|
| **Anonymization** | Generated participant IDs (no PII collected) |
| **Consent** | Required before study starts |
| **Transparency** | Participants can review data before upload |
| **Data Access** | Participants can download their data |
| **Storage** | Secure Firebase Firestore with access controls |

#### Ethical Considerations

- ✅ No personally identifiable information collected
- ✅ Anonymous participant IDs only
- ✅ Informed consent obtained before participation
- ✅ Data used solely for research purposes
- ✅ Participants can withdraw (opt-out before final upload)
- ✅ Clear explanation of data collection in consent form


---

## Technical Notes

### ⚙️ Implementation Details

#### Deduplication Strategy

**Problem**: Users might refresh or return to the Completion Page, causing duplicate uploads.

**Solution**: localStorage flags prevent re-uploads

| Flag | Purpose | Set When |
|------|---------|----------|
| `submission_sent` | Blocks aggregated data re-upload | After successful Firestore upload |
| `submission_docId` | Stores Firestore document ID | After successful upload |
| `task1_uploaded` | Blocks Task 1 specific re-upload | After Task 1 upload (if used) |
| `task1_docId` | Stores Task 1 document ID | After Task 1 upload |

**Logic Flow**:
```javascript
if (localStorage.getItem('submission_sent') === 'true') {
  // Skip upload - already completed
  return;
}
// Proceed with upload
```

---

#### Mouse Event Throttling

**Challenge**: Mouse events fire at very high frequency (potentially hundreds per second), leading to:
- Large data storage requirements
- Potential localStorage overflow
- Unnecessary granularity

**Solution**: Throttling and sampling

| Task | Method | Rate | Rationale |
|------|--------|------|-----------|
| **Task 1** | Throttle `mousemove` | 100ms intervals | Balance between movement capture and data size |
| **Task 2** | Throttle `mousemove` | 100ms intervals | Adequate for entropy calculation |
| **Task 3** | Component sampling | During interactions | Targeted capture per component |

**Implementation Example**:
```javascript
let lastMouseMoveTime = 0;
const THROTTLE_MS = 100;

element.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastMouseMoveTime >= THROTTLE_MS) {
    logMouseEvent(e);
    lastMouseMoveTime = now;
  }
});
```

---

#### Data Size Limits

**LocalStorage Limits**: Browsers typically allow ~5-10MB per domain.

**Safety Measures**:

| Array Type | Max Items | Reason |
|------------|-----------|--------|
| `mouse_data` | 5000 | Prevent overflow in long sessions |
| `hover_events` | 5000 | Limit for extensive exploration |
| `drag_attempts` | 1000 | Reasonable upper bound |

**Behavior**: When limits are reached, oldest items may be dropped or logging paused.

---

#### Error Handling

**Parse Errors**:
```javascript
try {
  const data = JSON.parse(localStorage.getItem('task_1_data'));
} catch (error) {
  // Log to internal_errors array
  metrics.internal_errors.push({
    type: 'parse_error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
}
```

**Firestore Upload Failures**:
```javascript
try {
  await db.collection('study_responses').add(payload);
  localStorage.setItem('submission_sent', 'true');
} catch (error) {
  // Show user-friendly error with retry option
  showUploadError(error);
}
```

**Missing Data**:
- Missing fields default to `null` or empty arrays `[]`
- Partial data uploads are allowed (e.g., if Task 3 incomplete)
- Validation checks before upload warn about incomplete data

---

#### Performance Optimizations

| Optimization | Implementation | Benefit |
|--------------|----------------|---------|
| **Debounced saves** | Save to localStorage every 1 second max | Reduce write operations |
| **Event batching** | Group events before logging | Fewer array operations |
| **Lazy initialization** | Create loggers only when task starts | Reduce memory footprint |
| **Compressed timestamps** | ISO 8601 strings instead of objects | Smaller JSON size |

---

### 🛠️ Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|-----------|
| **localStorage quota** | Large datasets may exceed 5-10MB | Throttling, array limits |
| **Browser refresh** | Task progress lost if mid-task | TaskProgressContext saves state |
| **No real-time sync** | Data upload only at completion | By design for performance |
| **Single-session** | No cross-device continuation | Participant must complete in one session |
| **No validation retry** | Failed constraint checks not retried | User must manually correct |

---

### 🔮 Future Enhancements

**Potential additions for future versions**:

#### Physiological Monitoring
- **Eye-tracking**: Gaze patterns, fixation duration, saccades
- **Heart Rate Variability (HRV)**: Physiological stress indicator
- **EEG Integration**: Direct brain activity measurement

#### Advanced Analytics
- **Real-time cognitive load estimation**: ML-based prediction during tasks
- **Adaptive task difficulty**: Adjust based on detected load
- **Predictive failure detection**: Warn before errors occur

#### Study Design Features
- **A/B testing framework**: Compare UI variations
- **Randomized task order**: Control for learning effects
- **Longitudinal tracking**: Multi-session studies

#### Technical Improvements
- **Real-time data sync**: Upload during tasks (not just at end)
- **Compressed storage**: Use compression for mouse data
- **Video/screen recording**: Capture full session recordings
- **Offline support**: Complete study without internet, sync later

---

## 📚 References & Resources

### NASA-TLX Documentation
- **Original Paper**: Hart, S. G., & Staveland, L. E. (1988). Development of NASA-TLX
- **Simplified Method**: Used in this implementation (equal weighting, no pairwise comparison)

### Cognitive Load Theory
- Sweller, J. (1988). Cognitive load during problem solving
- Paas, F., & van Merriënboer, J. J. G. (1994). Instructional control of cognitive load

### Mouse Behavior Research
- Freeman, J. B., & Ambady, N. (2010). MouseTracker: Software for studying real-time mental processing
- Entropy calculations based on information theory (Shannon entropy)

---

## 📞 Contact & Support

**Document Information**:
- **Version**: 2.0  
- **Last Updated**: February 13, 2026
- **Maintained By**: CogniViz Research Team

**For Questions**:
- Technical issues: Review code comments and this documentation
- Study design: Refer to consent form and task instructions
- Data analysis: See "Usage for Researchers" section above

---

## Appendix: Quick Reference

### Critical localStorage Keys
```
task_1_data                    → Task 1 metrics
task_2_data                    → Task 2 metrics
task3_metrics_{sessionId}      → Task 3 metrics
nasa_tlx_responses             → All TLX responses
submission_sent                → Upload flag
```

### Firestore Collections
```
study_responses/               → Primary data collection
task1/                         → Optional Task 1 collection
```

### Key Metric Names
```
total_time_ms                  → Task duration
raw_tlx_score                  → Subjective workload (10-90)
mouse_entropy                  → Movement complexity
rapid_hover_switches           → Decision uncertainty
budget_overrun_events          → Constraint violations
```

---

**End of Documentation**
