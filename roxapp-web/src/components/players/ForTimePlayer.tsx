import type { WorkoutSection } from "@/types/workout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForTimePlayerProps {
    section: WorkoutSection;
    elapsedTime: number;
    onComplete: () => void;
}

export function ForTimePlayer({ section, elapsedTime, onComplete }: ForTimePlayerProps) {
    const { exercises } = section;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-6 pt-12 overflow-y-auto">
            {/* Elapsed Time - Counting Up */}
            <div className="mb-8 text-center">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">Temps écoulé</p>
                <div className={cn(
                    "inline-block px-8 py-4 rounded-2xl",
                    "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10",
                    "border-2 border-yellow-500"
                )}>
                    <p className="text-7xl font-black text-white tabular-nums tracking-tight">
                        {formatTime(elapsedTime)}
                    </p>
                </div>
            </div>

            {/* Exercise List */}
            <div className="w-full max-w-md space-y-3 mb-8">
                {exercises.map((ex, idx) => (
                    <div
                        key={ex.id}
                        className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-500/30 flex items-center justify-center">
                                    <span className="text-sm font-bold text-yellow-400">{idx + 1}</span>
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

            {/* Completion Button */}
            <Button
                size="lg"
                onClick={onComplete}
                className={cn(
                    "w-full max-w-md gap-2 font-bold shadow-lg mb-8",
                    "bg-gradient-to-br from-yellow-500 to-yellow-600",
                    "hover:from-yellow-600 hover:to-yellow-700",
                    "text-black"
                )}
            >
                <CheckCircle2 className="w-5 h-5" />
                Terminer la séance
            </Button>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground max-w-md pb-8">
                <p>Complète tous les exercices le plus rapidement possible !</p>
            </div>
        </div>
    );
}
