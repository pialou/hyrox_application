import { Play, X, Clock, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkoutStructure } from "@/types/workout";

interface WorkoutDetailProps {
    workout: WorkoutStructure;
    apiWorkout: any; // API data for category, description, etc.
    onStart: () => void;
    onClose: () => void;
}

export function WorkoutDetail({ workout, apiWorkout, onStart, onClose }: WorkoutDetailProps) {
    const totalDuration = workout.sections.reduce((acc, s) => acc + (s.duration || 0), 0);
    const category = apiWorkout?.category || "Workout";

    // Category colors
    const categoryColors: Record<string, string> = {
        "Hyrox": "bg-red-500/10 text-red-500 border-red-500/20",
        "Run": "bg-green-500/10 text-green-500 border-green-500/20",
        "CrossFit": "bg-orange-500/10 text-orange-500 border-orange-500/20",
        "Hybrid": "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };

    // Display Name Mapping
    const displayCategory = (() => {
        if (category === "Hybrid" && (workout.title.includes("Renfo") || workout.title.includes("Bodyweight"))) return "Renfo/Muscu";
        if (category === "Ironx" && (workout.title.includes("Mobilité") || workout.title.includes("Mobility"))) return "Stretching";
        return category;
    })();

    const baseColor = categoryColors[category] || categoryColors["Hyrox"];

    // Override color for Renfo/Muscu (Blue) and Stretching (Violet)
    let finalColorClass = baseColor;
    if (displayCategory === "Stretching") {
        finalColorClass = "bg-violet-500/10 text-violet-500 border-violet-500/20";
    } else if (displayCategory === "Renfo/Muscu") {
        finalColorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }

    return (
        <div className="min-h-screen bg-black text-white pb-6">
            {/* Header with Close */}
            <div className="flex items-center justify-between px-6 pt-8 pb-4">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Workout Title & Category */}
            <div className="px-6 mt-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-3 ${finalColorClass}`}>
                    {displayCategory.toUpperCase()}
                </div>
                <h1 className="text-4xl font-bold mb-2">{workout.title}</h1>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-muted-foreground text-sm mt-4">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{Math.floor(totalDuration / 60)} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Dumbbell className="w-4 h-4" />
                        <span>{workout.sections.length} section{workout.sections.length > 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>

            {/* Description (if exists) */}
            {apiWorkout?.description && (
                <div className="px-6 mt-6">
                    <p className="text-muted-foreground leading-relaxed">{apiWorkout.description}</p>
                </div>
            )}

            {/* Sections Breakdown */}
            <div className="px-6 mt-8">
                <h2 className="text-lg font-semibold mb-4">Déroulé de la séance</h2>
                <div className="space-y-4">
                    {workout.sections.map((section, idx) => (
                        <div key={section.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <span className="text-xs text-muted-foreground">Section {idx + 1}</span>
                                    <h3 className="text-lg font-semibold">{section.title || section.type}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold">{Math.floor((section.duration || 0) / 60)}</span>
                                    <span className="text-sm text-muted-foreground ml-1">min</span>
                                </div>
                            </div>

                            {/* Section Type Badge */}
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                                {section.type}
                                {section.intervalDuration && (
                                    <span className="text-muted-foreground">· {section.intervalDuration}s intervals</span>
                                )}
                            </div>

                            {/* Exercises List */}
                            {section.exercises && section.exercises.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {section.exercises.map((exercise, exerciseIdx) => (
                                        <div key={exercise.id} className="flex items-center justify-between text-sm">
                                            <span className="text-white">{exerciseIdx + 1}. {exercise.name}</span>
                                            <span className="text-muted-foreground">
                                                {exercise.distance ? `${exercise.distance}m` : (exercise.reps ? `${exercise.reps} reps` : '')}
                                                {exercise.duration && ` ${exercise.duration}s`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm">
                <Button
                    onClick={onStart}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 shadow-2xl"
                >
                    <Play className="w-6 h-6 fill-white" />
                    Commencer la séance
                </Button>
            </div>
        </div>
    );
}
