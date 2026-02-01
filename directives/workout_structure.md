# Canonical Workout Data Structure

This document defines the strict JSON schema for the `planned_details` column in the `training_plan` table.
This structure is used by the Frontend Player and must be respected by the AI Agent (OpenClaw) when generating workouts.

## Root Object
```json
{
  "sections": [ ... ]
}
```

## Section Object
Every workout is composed of 1 or more sections.

```json
{
  "id": "uuid-string",
  "type": "Warmup" | "CoolDown" | "EMOM" | "AMRAP" | "ForTime" | "Rounds",
  "title": "String (e.g., 'Corps de séance')",
  "duration": Number, // Total duration in seconds (optional for ForTime)
  "intervalDuration": Number, // REQUIRED for EMOM (e.g., 60)
  "exercises": [ ... ],
  "notes": "String (Description or targets)"
}
```

## Exercise Object
```json
{
  "id": "uuid-string",
  "name": "String (e.g., 'Burpees')",
  "reps": Number, // Optional
  "distance": Number, // Optional (meters)
  "duration": Number, // Optional (seconds)
  "notes": "String (Audio alert text or tips)"
}
```

## Examples

### 1. Simple Run (Intervals) - stored as "Rounds"
```json
{
  "sections": [
    {
      "type": "Warmup",
      "title": "Échauffement",
      "duration": 600,
      "exercises": [ { "name": "Jogging" } ]
    },
    {
      "type": "Rounds",
      "title": "Corps de séance",
      "duration": 2400,
      "exercises": [
        { "name": "Run", "distance": 1000, "notes": "Pace 4:00/km" },
        { "name": "Rest", "duration": 120 }
      ]
    }
  ]
}
```

### 2. EMOM
```json
{
  "sections": [
    {
      "type": "EMOM",
      "title": "EMOM 20 min",
      "duration": 1200,
      "intervalDuration": 60,
      "exercises": [
        { "name": "15 Wall Balls" },
        { "name": "10 Burpees" },
        { "name": "400m Run" },
        { "name": "Rest" }
      ]
    }
  ]
}
```
