import { useState } from "react";
import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { useNoSleep } from "@/hooks/useNoSleep";
import type { WorkoutStructure } from "@/types/workout";
import { Button } from "@/components/ui/button";
import { X, Play, Pause, RotateCcw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMOMPlayer } from "@/components/players/EMOMPlayer";
import { AMRAPPlayer } from "@/components/players/AMRAPPlayer";
import { ForTimePlayer } from "@/components/players/ForTimePlayer";

interface WorkoutPlayerProps {
    workout: WorkoutStructure;
    onExit: () => void;
}

export function WorkoutPlayer({ workout, onExit }: WorkoutPlayerProps) {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const currentSection = workout.sections[currentSectionIndex];

    const {
        state,
        elapsedTime,
        intervalRemaining,
        remainingTime,
        currentRound,
        currentExercise,
        start,
        pause,
        resume,
        reset,
        complete,
        nextRound,
    } = useWorkoutTimer(currentSection);

    // Keep screen awake while timer is running
    useNoSleep(state === "running");

    const handleNextSection = () => {
        if (currentSectionIndex < workout.sections.length - 1) {
            setCurrentSectionIndex(prev => prev + 1);
            reset();
        }
    };

    // Auto-advance when distinct section completes (except last one)
    // We use a simple check on state change.
    if (state === "completed" && currentSectionIndex < workout.sections.length - 1) {
        handleNextSection();
    }

    const hasMultipleSections = workout.sections.length > 1;
    const isLastSection = currentSectionIndex === workout.sections.length - 1;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onExit}
                    className="text-white hover:bg-white/10"
                >
                    <X className="w-6 h-6" />
                </Button>

                <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">
                        {currentSection.type}
                        {hasMultipleSections && ` • Partie ${currentSectionIndex + 1}/${workout.sections.length}`}
                    </p>
                    <h1 className="text-lg font-bold text-white">
                        {currentSection.title || workout.title}
                    </h1>
                </div>

                {hasMultipleSections && !isLastSection && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextSection}
                        className="text-white hover:bg-white/10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                )}
                {!hasMultipleSections && <div className="w-10" />}
            </div>

            {/* Type-Specific Player */}
            {currentSection.type === "EMOM" && (
                <EMOMPlayer
                    section={currentSection}
                    intervalRemaining={intervalRemaining}
                    elapsedTime={elapsedTime}
                    currentExercise={currentExercise}
                />
            )}

            {currentSection.type === "AMRAP" && (
                <AMRAPPlayer
                    section={currentSection}
                    remainingTime={remainingTime}
                    currentRound={currentRound}
                    onCompleteRound={nextRound}
                />
            )}

            {(currentSection.type === "ForTime" ||
                currentSection.type === "Warmup" ||
                currentSection.type === "CoolDown" ||
                currentSection.type === "Rounds") && (
                    <ForTimePlayer
                        section={currentSection}
                        elapsedTime={elapsedTime}
                        onComplete={complete}
                    />
                )}

            {/* Controls */}
            <div className="p-6 pb-8 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={reset}
                        className="text-white hover:bg-white/10 w-14 h-14"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </Button>

                    {state === "idle" || state === "paused" ? (
                        <Button
                            size="lg"
                            onClick={state === "idle" ? start : resume}
                            className={cn(
                                "w-20 h-20 rounded-full",
                                "bg-gradient-to-br from-red-500 to-red-600",
                                "hover:from-red-600 hover:to-red-700",
                                "shadow-[0_0_30px_rgba(239,68,68,0.5)]",
                                "transition-all duration-300"
                            )}
                        >
                            <Play className="w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            onClick={pause}
                            className={cn(
                                "w-20 h-20 rounded-full",
                                "bg-gradient-to-br from-orange-500 to-orange-600",
                                "hover:from-orange-600 hover:to-orange-700",
                                "shadow-[0_0_30px_rgba(249,115,22,0.5)]",
                                "transition-all duration-300"
                            )}
                        >
                            <Pause className="w-8 h-8 fill-current" />
                        </Button>
                    )}

                    <div className="w-14" /> {/* Spacer for symmetry */}
                </div>

                {state === "completed" && (
                    <div className="mt-6 text-center">
                        {isLastSection ? (
                            <p className="text-2xl font-bold text-white animate-pulse">
                                ✅ Séance terminée !
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xl font-bold text-white">
                                    ✅ Partie {currentSectionIndex + 1} terminée !
                                </p>
                                <Button
                                    onClick={handleNextSection}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Partie suivante <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
