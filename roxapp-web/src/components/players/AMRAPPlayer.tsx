import type { WorkoutSection } from "@/types/workout";
import { cn } from "@/lib/utils";

interface AMRAPPlayerProps {
    section: WorkoutSection;
    remainingTime: number;
    currentRound: number;
}

export function AMRAPPlayer({ section, remainingTime, currentRound }: AMRAPPlayerProps) {
    const { exercises } = section;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12 overflow-y-auto">
            {/* Total Time Remaining - Large */}
            <div className="mb-8 text-center">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Temps restant</p>
                <div className={cn(
                    "inline-block px-8 py-4 rounded-2xl",
                    "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
                    "border-2 border-blue-500"
                )}>
                    <p className="text-7xl font-black text-white tabular-nums tracking-tight">
                        {formatTime(remainingTime)}
                    </p>
                </div>
            </div>

            {/* Round Counter */}
            <div className="mb-6 text-center">
                <p className="text-3xl font-bold text-blue-400">
                    Tour {currentRound}
                </p>
            </div>

            {/* Exercise List - Full View */}
            <div className="w-full max-w-md space-y-3 pb-8">
                {exercises.map((ex, idx) => (
                    <div
                        key={ex.id}
                        className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-400">{idx + 1}</span>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-white">{ex.name}</p>
                                    <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                        {ex.reps && <span>{ex.reps} reps</span>}
                                        {ex.duration && <span>{ex.duration}s</span>}
                                        {ex.distance && <span>{ex.distance}m</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground max-w-md pb-8">
                <p>Complète le maximum de tours avant la fin du temps !</p>
            </div>
        </div>
    );
}
