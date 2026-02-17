import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import type { WorkoutStructure } from "@/types/workout";
import { WeeklyCalendar } from "../components/WeeklyCalendar";
import { StatsWidget } from "../components/StatsWidget";
import { WorkoutCard } from "../components/WorkoutCard";
import { WorkoutPlayer } from "../components/WorkoutPlayer";
import { WorkoutDetail } from "../components/WorkoutDetail";
import { BottomNav } from "../components/BottomNav";

export function Home() {
    const [viewingWorkout, setViewingWorkout] = useState<WorkoutStructure | null>(null);
    const [playingWorkout, setPlayingWorkout] = useState<WorkoutStructure | null>(null);
    const [workouts, setWorkouts] = useState<WorkoutStructure[]>([]);
    const [apiWorkouts, setApiWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        total_distance_km: number;
        total_load: number;
        activity_count?: number;
        history?: { name: string; val: number }[];
        loadHistory?: { name: string; val: number }[];
    }>({ total_distance_km: 0, total_load: 0 });

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
                const now = new Date();
                const transformed: WorkoutStructure[] = fetchedWorkouts
                    .filter(w => w.planned_details && typeof w.planned_details === 'object')
                    .map(w => ({
                        id: w.id,
                        title: w.title,
                        date: w.session_date, // Map API date
                        sections: w.planned_details.sections || []
                    }))
                    // Filter future sessions only and sort by date ascending
                    .filter(w => new Date(w.date) >= new Date(now.toDateString()))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


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
        if (cat.includes("cross") || cat.includes("metcon")) return "CrossFit";
        if (cat.includes("renfo") || cat.includes("muscu") || cat.includes("hybrid") || cat.includes("bodyweight")) return "Renfo/Muscu";
        return "Hyrox"; // Default
    };

    if (playingWorkout) {
        return (
            <WorkoutPlayer
                workout={playingWorkout}
                onExit={() => setPlayingWorkout(null)}
            />
        );
    }

    if (viewingWorkout) {
        const apiData = apiWorkouts.find(w => w.id === viewingWorkout.id);
        return (
            <WorkoutDetail
                workout={viewingWorkout}
                apiWorkout={apiData || {}}
                onStart={() => {
                    setViewingWorkout(null);
                    setPlayingWorkout(viewingWorkout);
                }}
                onClose={() => setViewingWorkout(null)}
            />
        );
    }

    return (
        <div className="min-h-screen pb-20 bg-black text-white relative">
            {/* Header */}
            <header className="px-6 pt-8 pb-4">
                <h2 className="text-xl font-bold text-white mb-1">Bonjour Louis</h2>
            </header>

            {/* Weekly Calendar */}
            <div className="px-6 mb-8">
                <WeeklyCalendar workouts={workouts} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 px-6 mb-8">
                <StatsWidget
                    type="distance"
                    value={Number(stats.total_distance_km || 0).toFixed(1)}
                    unit="km"
                    label="Distance"
                    subtext="Cette semaine"
                    history={stats.history || [
                        { name: 'S-3', val: 0 },
                        { name: 'S-2', val: 0 },
                        { name: 'S-1', val: 0 },
                        { name: 'This', val: Number(stats.total_distance_km || 0) }
                    ]}
                />
                <StatsWidget
                    type="load"
                    value={Number(stats.total_load || 0)}
                    unit="TSS"
                    label="Charge"
                    subtext="Suffer Score"
                    history={stats.loadHistory || [
                        { name: 'S-3', val: 0 },
                        { name: 'S-2', val: 0 },
                        { name: 'S-1', val: 0 },
                        { name: 'This', val: Number(stats.total_load || 0) }
                    ]}
                />
            </div>

            {/* Workout List Header */}
            <div className="px-6 mb-4">
                <h1 className="text-2xl font-bold">Prochaine séance</h1>
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
                    </div>
                ) : (
                    workouts.slice(0, 2).map((workout) => {
                        const matchingApiWorkout = apiWorkouts.find(w => w.id === workout.id);
                        const cardCategory = matchingApiWorkout ? getCategoryFromAPI(matchingApiWorkout) : "Hyrox";

                        return (
                            <div key={workout.id} onClick={() => setViewingWorkout(workout)} className="cursor-pointer active:scale-95 transition-transform">
                                <WorkoutCard
                                    title={workout.title}
                                    duration={workout.sections[0]?.duration ? `${Math.floor(workout.sections[0].duration / 60)} min` : "N/A"}
                                    category={cardCategory}
                                    intensity={8}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
