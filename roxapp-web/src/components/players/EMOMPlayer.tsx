import type { WorkoutSection } from "@/types/workout";
import { cn } from "@/lib/utils";

interface EMOMPlayerProps {
    section: WorkoutSection;
    intervalRemaining: number;
    elapsedTime: number;
    currentExercise: number;
}

export function EMOMPlayer({ section, intervalRemaining, elapsedTime, currentExercise }: EMOMPlayerProps) {
    const { exercises, duration, intervalDuration } = section;

    const currentEx = exercises[currentExercise];

    const totalIntervals = duration && intervalDuration ? Math.floor(duration / intervalDuration) : 0;
    const completedIntervals = intervalDuration ? Math.floor(elapsedTime / intervalDuration) : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Get exercise details for display
    const getExerciseDetails = (ex: typeof currentEx) => {
        if (ex.reps) return `${ex.reps} reps`;
        if (ex.duration) return `${ex.duration}s`;
        if (ex.distance) return `${ex.distance}m`;
        return "";
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12">
            {/* Title Section - LARGE (seul titre maintenant) */}
            <div className="text-center mb-8">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">EMOM</p>
                <h1 className="text-4xl font-black text-white mb-3">
                    EMOM {duration ? Math.floor(duration / 60) : 0} min
                </h1>
                <p className="text-sm text-muted-foreground">
                    Interval {completedIntervals + 1} / {totalIntervals}
                </p>
            </div>

            {/* Main Timer Widget with Exercise Inside */}
            <div className="flex flex-col items-center justify-center mb-8">
                <div className={cn(
                    "relative px-10 py-6 rounded-3xl",
                    "bg-gradient-to-br from-green-500/20 to-green-600/10",
                    "border-4 border-green-500",
                    intervalRemaining <= 3 && "animate-pulse"
                )}>
                    {/* Timer */}
                    <p className="text-[140px] font-black text-white tabular-nums tracking-tighter leading-none text-center">
                        {formatTime(intervalRemaining)}
                    </p>

                    {/* Exercise Name & Details - Inside Widget */}
                    <div className="text-center mt-4">
                        <h2 className="text-3xl font-bold text-white mb-1">
                            {currentEx.name}
                        </h2>
                        <p className="text-xl text-green-400 font-semibold">
                            {getExerciseDetails(currentEx)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Spacer flexible pour pousser le bas */}
            <div className="flex-1" />

            {/* Bottom Section: Progress Bar + Next Exercise */}
            <div className="w-full max-w-md space-y-4 pb-32">
                {/* Progress Bar (juste au-dessus du bouton play) */}
                <div className="w-full">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                            style={{ width: `${(completedIntervals / totalIntervals) * 100}%` }}
                        />
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                        {completedIntervals} / {totalIntervals} complétés
                    </p>
                </div>

                {/* EMOM Cycle List */}
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold text-center">Circuit (1 Tour)</p>
                    {exercises.map((ex, idx) => {
                        const isActive = idx === currentExercise;
                        return (
                            <div
                                key={ex.id || idx}
                                className={cn(
                                    "rounded-2xl p-4 border transition-all duration-300",
                                    isActive
                                        ? "bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                        : "bg-white/5 border-white/10 opacity-60"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                            isActive ? "bg-green-500 text-black" : "bg-white/10 text-white"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <p className={cn("font-bold", isActive ? "text-white" : "text-gray-300")}>
                                            {ex.name}
                                        </p>
                                    </div>
                                    <p className={cn("text-sm", isActive ? "text-green-400" : "text-gray-500")}>
                                        {getExerciseDetails(ex)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
