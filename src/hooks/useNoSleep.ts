import { useEffect, useRef } from "react";
import NoSleep from "nosleep.js";

/**
 * useNoSleep - Prevents screen from sleeping during workouts
 * 
 * Automatically enables when timer starts, disables when paused/completed
 * Critical for user experience during intense workouts
 */
export function useNoSleep(isActive: boolean) {
    const noSleepRef = useRef<NoSleep | null>(null);

    useEffect(() => {
        // Initialize NoSleep instance
        if (!noSleepRef.current) {
            noSleepRef.current = new NoSleep();
        }

        const noSleep = noSleepRef.current;

        if (isActive) {
            noSleep.enable();
        } else {
            noSleep.disable();
        }

        // Cleanup on unmount
        return () => {
            if (noSleep) {
                noSleep.disable();
            }
        };
    }, [isActive]);
}
