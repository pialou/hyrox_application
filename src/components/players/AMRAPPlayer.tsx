import type { WorkoutSection } from "@/types/workout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AMRAPPlayerProps {
    section: WorkoutSection;
    remainingTime: number;
    currentRound: number;
    onCompleteRound: () => void;
}

export function AMRAPPlayer({ section, remainingTime, currentRound, onCompleteRound }: AMRAPPlayerProps) {
    const { exercises } = section;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-24 overflow-hidden relative">

            {/* 1. FLEXIBLE SPACER */}
            <div className="flex-[0.5]" />

            {/* 2. MASSIVE CENTERED TIMER */}
            <div className="mb-0 text-center flex-shrink-0 z-10 relative">
                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest opacity-60">AMRAP • {Math.floor((section.duration || 0) / 60)} MIN</p>
                <div className="inline-block">
                    <p className={cn(
                        "font-black text-white tabular-nums tracking-tighter leading-none shadow-black drop-shadow-2xl",
                        "text-[100px] md:text-[140px]" // Huge font
                    )}>
                        {formatTime(remainingTime)}
                    </p>
                    <p className="text-2xl font-bold text-blue-500 mt-2">
                        Tour {currentRound}
                    </p>
                </div>
            </div>

            {/* 3. FLEXIBLE SPACER */}
            <div className="flex-1" />

            {/* 4. BOTTOM WIDGETS */}
            <div className="w-full max-w-md w-full z-10 space-y-3 flex flex-col justify-end">
                <div className="max-h-[35vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {exercises.map((ex, idx) => (
                        <div
                            key={ex.id || idx}
                            className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/5 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    "bg-blue-500 text-white"
                                )}>
                                    {idx + 1}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white leading-tight">{ex.name}</p>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        {ex.distance ? <span>{ex.distance}m</span> : (ex.reps ? <span>{ex.reps} reps</span> : null)}
                                        {ex.duration && <span>{ex.duration}s</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Completion Button */}
                <Button
                    size="lg"
                    onClick={onCompleteRound}
                    className={cn(
                        "w-full gap-2 font-bold shadow-lg h-14 mt-2",
                        "bg-gradient-to-br from-yellow-500 to-yellow-600",
                        "hover:from-yellow-600 hover:to-yellow-700",
                        "text-black uppercase tracking-wide"
                    )}
                >
                    <CheckCircle2 className="w-5 h-5" />
                    Terminer le round
                </Button>

                <div className="text-center text-xs text-muted-foreground pb-2">
                    <p>Enchaîne les tours jusqu'à la fin du temps !</p>
                </div>
            </div>
        </div>
    );
}
