import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import type { WorkoutStructure } from "@/types/workout";
import { WeeklyCalendar } from "../components/WeeklyCalendar";
import { StatsWidget } from "../components/StatsWidget";
import { WorkoutCard } from "../components/WorkoutCard";
import { WorkoutPlayer } from "../components/WorkoutPlayer";
import { BottomNav } from "../components/BottomNav";

export function Home() {
    const [selectedWorkout, setSelectedWorkout] = useState<WorkoutStructure | null>(null);
    const [workouts, setWorkouts] = useState<WorkoutStructure[]>([]);
    const [apiWorkouts, setApiWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_distance_km: 0, total_load: 0 });

    // Fetch real workouts and stats from API
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch both workouts and stats in parallel
                const [fetchedWorkouts, fetchedStats] = await Promise.all([
                    apiService.getWorkouts({ status: "planned" }),
                    apiService.getStravaStats().catch(err => {
                        console.error("Failed to fetch Strava stats:", err);
                        return { total_distance_km: 0, total_load: 0, activity_count: 0 };
                    })
                ]);

                setApiWorkouts(fetchedWorkouts);
                setStats(fetchedStats);

                // Transform API workouts to WorkoutStructure
                const transformed: WorkoutStructure[] = fetchedWorkouts
                    .filter(w => w.planned_details && typeof w.planned_details === 'object')
                    .map(w => ({
                        id: w.id,
                        title: w.title,
                        sections: w.planned_details.sections || []
                    }));

                setWorkouts(transformed);
            } catch (error) {
                console.error("Failed to load data:", error);
                setWorkouts([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Map API category to display category
    const getCategoryFromAPI = (apiWorkout: any): "Run" | "Hyrox" | "CrossFit" | "Renfo/Muscu" => {
        const cat = apiWorkout?.category?.toLowerCase() || "";
        if (cat.includes("hyrox")) return "Hyrox";
        if (cat.includes("run")) return "Run";
        if (cat.includes("cross")) return "CrossFit";
        if (cat.includes("renfo") || cat.includes("muscu") || cat.includes("hybrid")) return "Renfo/Muscu";
        return "Hyrox"; // Default
    };

    if (selectedWorkout) {
        return (
            <WorkoutPlayer
                workout={selectedWorkout}
                onExit={() => setSelectedWorkout(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <header className="px-6 pt-8 pb-4">
                <h2 className="text-sm text-muted-foreground mb-1">Bonjour Louis</h2>
                <h1 className="text-3xl font-bold">Prochaine séance</h1>
            </header>

            {/* Weekly Calendar */}
            <div className="px-6 mb-8">
                <WeeklyCalendar />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 px-6 mb-8">
                <StatsWidget
                    type="distance"
                    value={Number(stats.total_distance_km).toFixed(1)}
                    unit="km"
                    label="Distance"
                    subtext="Cette semaine"
                />
                <StatsWidget
                    type="load"
                    value={Number(stats.total_load)}
                    unit="TSS"
                    label="Charge"
                    subtext="Suffer Score"
                />
            </div>

            {/* Workout List - Only show 2 next workouts */}
            <div className="px-6 space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Chargement des séances...</p>
                    </div>
                ) : workouts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Aucune séance planifiée</p>
                        <p className="text-sm mt-2">Utilisez le chat pour générer un plan</p>
                    </div>
                ) : (
                    workouts.slice(0, 2).map((workout, idx) => {
                        const matchingApiWorkout = apiWorkouts.find(w => w.id === workout.id);
                        const cardCategory = matchingApiWorkout ? getCategoryFromAPI(matchingApiWorkout) : "Hyrox";

                        return (
                            <WorkoutCard
                                key={workout.id}
                                title={workout.title}
                                duration={workout.sections[0]?.duration ? `${Math.floor(workout.sections[0].duration / 60)} min` : "N/A"}
                                category={cardCategory}
                                intensity={8}
                                onStartSession={idx === 0 ? () => setSelectedWorkout(workout) : undefined}
                            />
                        );
                    })
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
