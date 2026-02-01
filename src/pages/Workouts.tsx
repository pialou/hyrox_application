import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import type { WorkoutStructure } from "@/types/workout";
import { WorkoutCard } from "../components/WorkoutCard";
import { WorkoutDetail } from "../components/WorkoutDetail";
import { WorkoutPlayer } from "../components/WorkoutPlayer";
import { BottomNav } from "../components/BottomNav";

export function Workouts() {
    const [selectedWorkout, setSelectedWorkout] = useState<{ workout: WorkoutStructure, apiData: any } | null>(null);
    const [playingWorkout, setPlayingWorkout] = useState<WorkoutStructure | null>(null);
    const [workouts, setWorkouts] = useState<WorkoutStructure[]>([]);
    const [apiWorkouts, setApiWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWorkouts = async () => {
            try {
                const fetchedApiWorkouts = await apiService.getWorkouts({ status: "planned" });

                // Filter: only workouts from today onwards
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const filteredWorkouts = fetchedApiWorkouts.filter(w => {
                    if (!w.session_date) return false;
                    const workoutDate = new Date(w.session_date);
                    return workoutDate >= today;
                });

                setApiWorkouts(filteredWorkouts);

                const transformed: WorkoutStructure[] = filteredWorkouts
                    .filter(w => w.planned_details && typeof w.planned_details === 'object')
                    .map(w => ({
                        id: w.id,
                        title: w.title,
                        sections: w.planned_details.sections || [],
                        session_date: w.session_date
                    }));

                setWorkouts(transformed);
            } catch (error) {
                console.error("Failed to load workouts:", error);
                setWorkouts([]);
            } finally {
                setLoading(false);
            }
        };

        loadWorkouts();
    }, []);

    const getCategoryFromAPI = (apiWorkout: any): "Run" | "Hyrox" | "CrossFit" | "Renfo/Muscu" => {
        const cat = apiWorkout?.category?.toLowerCase() || "";
        if (cat.includes("hyrox")) return "Hyrox";
        if (cat.includes("run")) return "Run";
        if (cat.includes("cross")) return "CrossFit";
        if (cat.includes("renfo") || cat.includes("muscu") || cat.includes("hybrid")) return "Renfo/Muscu";
        return "Hyrox";
    };

    // Group workouts by date
    const groupedWorkouts: Record<string, { workouts: WorkoutStructure[], apiWorkouts: any[] }> = {};

    workouts.forEach((workout: any) => {
        const apiWorkout = apiWorkouts.find(w => w.id === workout.id);
        const date = apiWorkout?.session_date ? new Date(apiWorkout.session_date) : new Date();
        const dayKey = date.toISOString().split('T')[0];

        if (!groupedWorkouts[dayKey]) {
            groupedWorkouts[dayKey] = { workouts: [], apiWorkouts: [] };
        }
        groupedWorkouts[dayKey].workouts.push(workout);
        groupedWorkouts[dayKey].apiWorkouts.push(apiWorkout);
    });

    // Sort dates
    const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) return "Aujourd'hui";

        // Use weekday names for all future days (no "Demain")
        const weekdays = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        return weekdays[date.getDay()];
    };

    // If playing a workout, show player
    if (playingWorkout) {
        return (
            <WorkoutPlayer
                workout={playingWorkout}
                onExit={() => setPlayingWorkout(null)}
            />
        );
    }

    // If viewing workout detail, show preview
    if (selectedWorkout) {
        return (
            <WorkoutDetail
                workout={selectedWorkout.workout}
                apiWorkout={selectedWorkout.apiData}
                onStart={() => setPlayingWorkout(selectedWorkout.workout)}
                onClose={() => setSelectedWorkout(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            <header className="px-6 pt-8 pb-6 border-b border-white/5">
                <h1 className="text-3xl font-bold">Mes séances</h1>
            </header>

            <div className="px-6 mt-6">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Chargement des séances...</p>
                    </div>
                ) : sortedDates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Aucune séance planifiée</p>
                    </div>
                ) : (
                    sortedDates.map(dateKey => (
                        <div key={dateKey} className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
                                {formatDateLabel(dateKey)}
                            </h2>
                            <div className="space-y-4">
                                {groupedWorkouts[dateKey].workouts.map((workout, idx) => {
                                    const matchingApiWorkout = groupedWorkouts[dateKey].apiWorkouts[idx];
                                    const cardCategory = matchingApiWorkout ? getCategoryFromAPI(matchingApiWorkout) : "Hyrox";

                                    return (
                                        <div
                                            key={workout.id}
                                            onClick={() => setSelectedWorkout({ workout, apiData: matchingApiWorkout })}
                                            className="cursor-pointer"
                                        >
                                            <WorkoutCard
                                                title={workout.title}
                                                duration={workout.sections[0]?.duration ? `${Math.floor(workout.sections[0].duration / 60)} min` : "N/A"}
                                                category={cardCategory}
                                                intensity={8}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <BottomNav />
        </div>
    );
}
