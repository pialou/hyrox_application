// Types for Workout Player
export type WorkoutType = "EMOM" | "AMRAP" | "ForTime" | "Rounds" | "Warmup" | "CoolDown";

export type Exercise = {
    id: string;
    name: string;
    reps?: number;
    duration?: number; // seconds
    distance?: number; // meters
    rest?: number; // seconds
    notes?: string;
}

export type WorkoutSection = {
    id: string;
    type: WorkoutType;
    title?: string;
    duration?: number; // Total duration for EMOM/AMRAP (seconds)
    intervalDuration?: number; // For EMOM: seconds per exercise (e.g., 60)
    rounds?: number; // For Rounds/ForTime
    exercises: Exercise[];
    restBetweenRounds?: number; // seconds
}

export type WorkoutStructure = {
    id: string;
    title: string;
    date?: string; // ISO Date string (YYYY-MM-DD)
    sections: WorkoutSection[]; // Support multi-part workouts (e.g., EMOM -> AMRAP)
}

// Timer States
export type TimerState = "idle" | "running" | "paused" | "completed";

export type TimerContext = {
    currentSection: number;
    currentRound: number;
    currentExercise: number;
    elapsedTime: number; // Total elapsed in seconds
    intervalTime: number; // For EMOM: seconds within current interval
    remainingTime: number; // For EMOM/AMRAP
    state: TimerState;
}
