# CogniViz Study - Metrics & Data Collection Documentation

## Overview

**CogniViz** is a cognitive workload research application that measures user performance and subjective workload across three interactive tasks. After each task, participants complete a NASA-TLX questionnaire to self-report their cognitive load. All metrics are stored locally in the browser's localStorage and then aggregated and uploaded to Firebase Firestore upon study completion.

---

## Study Flow

1. **Consent & Instructions** → Participant reads consent form and instructions
2. **Task 1** → E-commerce form data entry task
3. **NASA-TLX Questionnaire** → After Task 1
4. **Task 2** → Product filtering and exploration task
5. **NASA-TLX Questionnaire** → After Task 2
6. **Task 3** → Multi-component travel planning task (budget, flights, hotels, meetings, transport)
7. **NASA-TLX Questionnaire** → After Task 3
8. **Completion Page** → Automatic data upload to Firestore

---

## Tasks Description

### Task 1: Data Entry Form
**Purpose:** Measure cognitive load during form completion with validation and field navigation.

**User Actions:**
- Fill out billing and shipping information
- Select shipping method
- Navigate through multiple form fields
- Handle validation errors

**Logged by:** `useTask1Logger` hook (`src/hooks/useTask1Logger.js`)

---

### Task 2: Product Exploration & Filtering
**Purpose:** Measure cognitive load during product search, filtering, and comparison.

**User Actions:**
- Apply filters (price, category, brand)
- Hover over products to view details
- Compare multiple products
- Make selection decisions

**Logged by:** `useTask2Logger` hook (`src/hooks/useTask2Logger.js`)

---

### Task 3: Travel Planning
**Purpose:** Measure cognitive load in a complex multi-component task with constraints.

**User Actions:**
- Book flights (outbound and return with time constraints)
- Book hotel (distance constraint)
- Select transportation
- Schedule meetings (drag-and-drop with conflict detection)
- Manage budget (€1,380 limit)

**Logged by:** `useTask3Logger` hook (`src/hooks/useTask3Logger.js`)

---

## Metrics Recorded Per Task

### Task 1 Metrics - JSON Structure

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

**Key Metrics Explanation:**
- **timestamps**: Start and end times in ISO 8601 format
- **total_time_ms**: Total task duration in milliseconds
- **success**: Whether the task was completed successfully
- **error_count**: Number of validation errors encountered
- **help_requests**: Number of times user requested help
- **field_interactions**: Per-field metrics including focus time, backspace count, and edit count
- **mouse_data**: Raw mouse and keyboard event logs (throttled to 100ms for mousemove)
- **zip_code_corrections**: Specific to Task 1, tracks how many times the zip code was edited
- **shipping_method_changes**: Number of times shipping method was changed
- **field_sequence**: Order in which fields were focused

---

### Task 2 Metrics - JSON Structure

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

**Key Metrics Explanation:**
- **filter_uses**: Complete history of filter applications with before/after values
- **filter_sequence**: Order in which different filter types were first used
- **filter_resets**: Number of times all filters were cleared
- **products_viewed**: List of products hovered over with duration in milliseconds
- **rapid_hover_switches**: Count of rapid switches between products (< 500ms between hovers)
- **time_to_first_filter**: Milliseconds from task start to first filter application
- **decision_time_ms**: Time from last filter change to task completion
- **comparison_count**: Number of unique products viewed (hovered)
- **mouse_entropy**: Calculated complexity of mouse movement path (higher = more erratic movement)
- **click_precision**: Distance between click location and target center

---

### Task 3 Metrics - JSON Structure

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

**Key Metrics Explanation:**

**General:**
- **session_id**: Unique identifier for this task session
- **total_actions**: Total number of user actions (selections, drags, etc.)
- **component_switches**: Log of tab/component navigation
- **idle_periods**: Periods of inactivity > 3 seconds

**Budget Tracking:**
- **current_total**: Current total cost in euros
- **updates**: Complete history of budget changes with cause and detail
- **budget_overrun_events**: Number of times budget exceeded €1,380
- **cost_adjustment_actions**: Number of times user reduced cost after overrun
- **in_overrun**: Current overrun state (boolean)
- **overrun_selection_counter**: Selections made while in overrun state

**Flights:**
- **hover_events**: Flights user hovered over with duration
- **selections**: Flight bookings with constraint validation
- **follows_rules**: Whether selection meets task constraints:
  - Outbound: arrival before 15:00
  - Return: departure ≥ 12:00 AND arrival next day
- **mouse_entropy**: Movement complexity during flight selection

**Hotels:**
- **selections**: Hotel bookings with distance constraint validation
- **within_5km**: Whether hotel is within 5km of city center (constraint)

**Transportation:**
- **selections**: Transportation mode chosen with price

**Meetings:**
- **drag_attempts**: Complete log of drag-and-drop attempts
- **attempts**: Each drop attempt with validation result
- **placement_duration_ms**: Total time to successfully place meeting
- **final_slot**: Successfully placed time slot

**Computed Signals:**
- **rapid_selection_changes**: Count of rapid selection changes (≥3 selections within 5 seconds)
- **mouse_entropy**: Calculated per component area (higher = more complex/erratic movement)

---

## NASA-TLX Questionnaire

### What is NASA-TLX?

The **NASA Task Load Index (NASA-TLX)** is a widely-used, multidimensional assessment tool for measuring subjective workload. It provides an overall workload score based on a weighted average of ratings on six subscales.

### Six Dimensions

The questionnaire measures cognitive load across six dimensions:

1. **Mental Demand**: How much thinking, deciding, or remembering did the task require?
2. **Physical Demand**: How much physical effort was involved? (Clicking, typing, mouse movement)
3. **Temporal Demand**: How much time pressure did you feel due to the pace of the task?
4. **Performance**: How successful do you think you were in accomplishing the task goals?
5. **Effort**: How hard did you have to work to achieve your level of performance?
6. **Frustration**: How insecure, discouraged, or annoyed did you feel during the task?

### Response Scale

Each dimension is rated on a **5-point scale** with descriptive labels:

- **Score 10** (0-20 range): Very Low / Very Easy
- **Score 30** (21-40 range): Low / Simple
- **Score 50** (41-60 range): Moderate
- **Score 70** (61-80 range): High / Challenging
- **Score 90** (81-100 range): Very High / Extremely Demanding

### Question Order

Questions are **randomized** for each participant using the Fisher-Yates shuffle algorithm to prevent order effects.

### NASA-TLX Response JSON Structure

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

**Fields Explanation:**
- **task_id**: Identifier of the task (e.g., "task_1_form", "task_2_form", "task_3_form")
- **nasa_tlx_scores**: Object containing all six dimension scores (10, 30, 50, 70, or 90)
- **raw_tlx_score**: Simple average of all six scores, rounded to 1 decimal place
- **timestamp**: ISO 8601 timestamp of questionnaire submission

### Scoring Calculation

```javascript
raw_tlx_score = (mental_demand + physical_demand + temporal_demand + 
                 performance + effort + frustration) / 6
```

This implementation uses the **simplified NASA-TLX** method (equal weighting) rather than the original weighted method with pairwise comparisons.

---

## Data Storage & Flow

### LocalStorage Keys

**Task Data:**
- `task_1_data`: Task 1 metrics (form entry)
- `task_2_data`: Task 2 metrics (product exploration)
- `task3_metrics_{sessionId}`: Task 3 metrics (travel planning) - uses unique session ID

**NASA-TLX Data:**
- `nasa_tlx_task_1_form`: Individual Task 1 questionnaire response
- `nasa_tlx_task_2_form`: Individual Task 2 questionnaire response
- `nasa_tlx_task_3_form`: Individual Task 3 questionnaire response
- `nasa_tlx_responses`: Aggregated array of all questionnaire responses

**Participant & Session:**
- `participantId`: Anonymous participant identifier
- `consentGiven`: Consent status (true/false)
- `taskProgress`: Current task and completed tasks

**Upload Tracking (Deduplication):**
- `submission_sent`: Flag to prevent duplicate aggregated uploads
- `submission_docId`: Firestore document ID of aggregated submission
- `task1_uploaded`: Flag to prevent duplicate Task 1 uploads
- `task1_docId`: Firestore document ID of Task 1 submission

### Data Flow Sequence

```
1. User starts Task 1
   └─> useTask1Logger.markStart() initializes timestamps

2. User interacts with form
   └─> Field focus/blur/change events logged
   └─> Mouse and keyboard events captured
   └─> Validation errors counted

3. User completes Task 1
   └─> useTask1Logger.markEnd() calculates duration
   └─> useTask1Logger.saveToLocalStorage() saves to 'task_1_data'

4. NASA-TLX Questionnaire appears
   └─> User answers 6 questions (randomized order)
   └─> On submit: saveQuestionnaireResponse('task_1_form', scores)
   └─> Saves to 'nasa_tlx_task_1_form' and 'nasa_tlx_responses' array

5. Repeat steps 1-4 for Task 2 and Task 3

6. User reaches Completion Page
   └─> buildAggregatedStudyPayload() collects all data from localStorage
   └─> sendAggregatedStudyData() uploads to Firestore 'study_responses' collection
   └─> Sets 'submission_sent' flag to prevent duplicates
```

### Aggregated Payload Structure

When all tasks are complete, the following payload is sent to Firestore:

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

### Firestore Collections

**Collection: `study_responses`**
- Contains aggregated data for all tasks and questionnaires per participant
- One document per participant/session
- Used for final analysis

**Collection: `task1`**
- Optional collection for Task 1 specific analysis
- Contains only Task 1 metrics
- Uploaded separately via `sendTask1Metrics()`

---

## Key Files Reference

### Components
- **`src/components/QuestionnaireModal.jsx`**: NASA-TLX UI implementation with 6 randomized questions

### Hooks (Loggers)
- **`src/hooks/useTask1Logger.js`**: Task 1 metrics collection
- **`src/hooks/useTask2Logger.js`**: Task 2 metrics collection
- **`src/hooks/useTask3Logger.js`**: Task 3 metrics collection

### Utilities
- **`src/utils/tlx.js`**: NASA-TLX scoring, storage, and retrieval functions
- **`src/utils/dataCollection.js`**: Aggregation and Firestore upload logic
- **`src/utils/firebase.js`**: Firebase configuration and initialization

### Context
- **`src/contexts/TaskProgressContext.jsx`**: Orchestrates task flow and questionnaire triggering

### Pages
- **`src/pages/Task1.jsx`**: Form entry task implementation
- **`src/pages/Task2.jsx`**: Product exploration task implementation
- **`src/pages/Task3.jsx`**: Travel planning task implementation
- **`src/pages/CompletionPage.jsx`**: Final data upload and thank you page

---

## Usage for Researchers

### Accessing Participant Data

1. **From Firestore Console:**
   - Navigate to `study_responses` collection
   - Each document contains complete participant data
   - Filter by timestamp or participantId

2. **Download from UI:**
   - Participants can download their own data on the Completion Page
   - JSON format with all metrics and questionnaire responses

### Analyzing Metrics

**Task Performance:**
- `total_time_ms`: Task completion time
- `success`: Task completion status
- `error_count`: Number of errors encountered

**Cognitive Load Indicators:**
- NASA-TLX `raw_tlx_score`: Self-reported workload (0-100)
- `mouse_entropy`: Movement complexity (higher = more cognitive load)
- `rapid_hover_switches` / `rapid_selection_changes`: Decision uncertainty
- `idle_periods`: Hesitation or confusion

**Task-Specific Analysis:**
- Task 1: Field navigation patterns, edit counts, backspace usage
- Task 2: Filter strategy, product comparison behavior, decision time
- Task 3: Budget management, constraint violation attempts, meeting scheduling efficiency

### Privacy & Ethics

- All data is **anonymized** using generated participant IDs
- No personally identifiable information (PII) is collected
- Participants can download their data before submission
- Data is used solely for research purposes

---

## Technical Notes

### Deduplication Strategy

The app prevents duplicate uploads using localStorage flags:
- `submission_sent`: Prevents re-uploading aggregated data
- `task1_uploaded`: Prevents re-uploading Task 1 data

If a user refreshes or returns to the Completion Page, the app will not re-upload data.

### Mouse Event Throttling

- **Task 1 & 2**: Mousemove events throttled to 100ms intervals to reduce data volume
- **Task 3**: Uses mouse sampling during specific component interactions

### Data Size Limits

- Task 3 arrays have safety limits (5000 items max) to prevent localStorage overflow
- Mousemove data is sampled/throttled to balance granularity and storage

### Error Handling

- Parse errors in localStorage are caught and logged to `internal_errors` array
- Failed Firestore uploads are caught and reported to user with retry option
- Missing data fields default to null or empty arrays

---

## Future Enhancements

Potential additions for future versions:
- Eye-tracking integration
- Heart rate variability (HRV) monitoring
- Screen recording integration
- Real-time cognitive load estimation
- A/B testing framework for UI variations

---

**Document Version:** 1.0  
**Last Updated:** November 12, 2025  
**Contact:** CogniViz Research Team
