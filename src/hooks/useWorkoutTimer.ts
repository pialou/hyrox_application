import { useState, useEffect, useRef, useCallback } from "react";
import type { WorkoutSection, TimerState } from "@/types/workout";

/**
 * useWorkoutTimer - Offline-first timer hook with EMOM interval support
 * 
 * Handles EMOM auto-transitions, AMRAP countdown, ForTime elapsed tracking
 * Uses requestAnimationFrame for precision
 */
export function useWorkoutTimer(section: WorkoutSection) {
    const [state, setState] = useState<TimerState>("idle");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [intervalTime, setIntervalTime] = useState(0); // For EMOM
    const [currentExercise, setCurrentExercise] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);

    const startTimeRef = useRef<number | null>(null);
    const lastIntervalTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);

    const { type, duration, intervalDuration, exercises } = section;

    // Initialize AudioContext
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }, []);

    // Play beep sound
    const playBeep = useCallback((frequency: number = 800, duration: number = 100) => {
        initAudio();
        const ctx = audioContextRef.current;
        if (!ctx) return;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);
    }, [initAudio]);

    // Auto-advance exercise for EMOM
    const autoAdvanceExercise = useCallback(() => {
        setCurrentExercise(prev => {
            const next = (prev + 1) % exercises.length;
            return next;
        });
        setIntervalTime(0);
        lastIntervalTimeRef.current = elapsedTime;
        playBeep(1200, 200); // Long beep for transition
    }, [exercises.length, elapsedTime, playBeep]);

    // Main timer loop
    const tick = useCallback((timestamp: number) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
            lastTickRef.current = timestamp;
            lastIntervalTimeRef.current = 0;
        }

        const elapsed = Math.floor((timestamp - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);

        // Calculate interval time for EMOM
        const interval = elapsed - lastIntervalTimeRef.current;
        setIntervalTime(interval);

        // EMOM: Auto-transition every {intervalDuration} seconds
        if (type === "EMOM" && intervalDuration && interval >= intervalDuration) {
            autoAdvanceExercise();
        }

        // EMOM: Countdown beeps (3-2-1)
        if (type === "EMOM" && intervalDuration) {
            const secondsLeft = intervalDuration - interval;
            const lastSecond = Math.floor(lastTickRef.current / 1000);
            const currentSecond = Math.floor(timestamp / 1000);

            if (currentSecond !== lastSecond && secondsLeft <= 3 && secondsLeft > 0) {
                playBeep(800, 100); // Short beep for countdown
            }
        }

        // Check completion (AMRAP/EMOM with duration)
        if ((type === "AMRAP" || type === "EMOM") && duration && elapsed >= duration) {
            setState("completed");
            playBeep(600, 300); // Completion beep
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        lastTickRef.current = timestamp;
        animationFrameRef.current = requestAnimationFrame(tick);
    }, [type, duration, intervalDuration, autoAdvanceExercise, playBeep]);

    // Start timer
    const start = useCallback(() => {
        initAudio();
        setState("running");
        startTimeRef.current = null;
        lastIntervalTimeRef.current = 0;
        animationFrameRef.current = requestAnimationFrame(tick);
        playBeep(1200, 100); // Start beep
    }, [tick, playBeep, initAudio]);

    // Pause timer
    const pause = useCallback(() => {
        setState("paused");
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }, []);

    // Resume timer
    const resume = useCallback(() => {
        setState("running");
        startTimeRef.current = performance.now() - elapsedTime * 1000;
        lastIntervalTimeRef.current = elapsedTime - intervalTime;
        animationFrameRef.current = requestAnimationFrame(tick);
    }, [elapsedTime, intervalTime, tick]);

    // Reset timer
    const reset = useCallback(() => {
        setState("idle");
        setElapsedTime(0);
        setIntervalTime(0);
        setCurrentRound(1);
        setCurrentExercise(0);
        startTimeRef.current = null;
        lastIntervalTimeRef.current = 0;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }, []);

    // Manual next exercise (for AMRAP/ForTime)
    const nextExercise = useCallback(() => {
        setCurrentExercise(prev => Math.min(prev + 1, exercises.length - 1));
        playBeep(900, 100);
    }, [exercises.length, playBeep]);

    // Next round
    const nextRound = useCallback(() => {
        setCurrentRound(prev => prev + 1);
        setCurrentExercise(0);
        playBeep(1100, 150);
    }, [playBeep]);

    // Complete workout (for ForTime)
    const complete = useCallback(() => {
        setState("completed");
        playBeep(600, 300);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }, [playBeep]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Calculate remaining time
    const remainingTime = duration ? Math.max(0, duration - elapsedTime) : 0;
    const intervalRemaining = intervalDuration ? Math.max(0, intervalDuration - intervalTime) : 0;

    return {
        state,
        elapsedTime,
        intervalTime,
        intervalRemaining,
        remainingTime,
        currentRound,
        currentExercise,
        start,
        pause,
        resume,
        reset,
        nextExercise,
        nextRound,
        complete,
        playBeep,
    };
}
