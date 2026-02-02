import { cn } from "@/lib/utils"
import type { WorkoutStructure } from "@/types/workout";

interface WeeklyCalendarProps {
    workouts: WorkoutStructure[];
}

export function WeeklyCalendar({ workouts }: WeeklyCalendarProps) {
    // Helper to get current week (Mon-Sun)
    const getWeekDays = () => {
        const curr = new Date();

        // Note: JS getDay() returns 0 for Sunday. We want Monday as start.
        // Complex logic simplified: assume we are around the simplified date. 
        // A better approach for a robust app is date-fns, but here we'll stick to native for simplicity if possible.

        // Let's rely on creating dates relative to "today"
        // 0 = Sun, 1 = Mon ... 6 = Sat
        const dayOfWeek = curr.getDay(); // 0-6
        // If Sunday (0), we want to go back 6 days to Monday.
        // If Monday (1), we go back 0 days.
        const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const monday = new Date(curr);
        monday.setDate(curr.getDate() + diffToMon);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays();
    const today = new Date();

    const getDayLabel = (date: Date) => {
        const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        return days[date.getDay()];
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const getActivityColor = (category: string) => {
        if (category.includes("Run")) return "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]";
        if (category.includes("Hyrox")) return "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]";
        if (category.includes("Renfo")) return "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]";
        if (category.includes("CrossFit")) return "bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]";
        if (category.includes("Stretching")) return "bg-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]";
        return "bg-gray-500 text-white";
    };

    const getActivityLabel = (category: string) => {
        if (category.includes("Run")) return "RUN";
        if (category.includes("Hyrox")) return "HYX";
        if (category.includes("Renfo")) return "REN";
        if (category.includes("CrossFit")) return "XFT";
        if (category.includes("Stretching")) return "STR";
        return "WOD";
    };

    const getCategoryFromTitle = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes("run") || t.includes("course")) return "Run";
        if (t.includes("hyrox")) return "Hyrox";
        if (t.includes("renfo") || t.includes("muscu") || t.includes("bodyweight")) return "Renfo";
        if (t.includes("stretching") || t.includes("mobilité")) return "Stretching";
        if (t.includes("metcon") || t.includes("cross")) return "CrossFit";
        return "Hyrox";
    };

    return (
        <div className="w-full bg-card/50 backdrop-blur-md rounded-3xl p-4 border border-white/5">
            <h2 className="text-xl font-bold mb-4 pl-2">Ma semaine</h2>
            <div className="flex justify-between items-start">
                {weekDays.map((date, i) => {
                    const isToday = isSameDay(date, today);
                    // Find workouts for this day
                    const dayWorkouts = workouts.filter(w => {
                        if (!w.date) return false;
                        const wDate = new Date(w.date);
                        return isSameDay(wDate, date);
                    });

                    return (
                        <div key={i} className="flex flex-col items-center gap-3 flex-1">
                            {/* Day & Date */}
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-xs font-medium text-muted-foreground">{getDayLabel(date)}</span>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                                    isToday
                                        ? "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)] scale-110" // Red for Today
                                        : "bg-secondary text-secondary-foreground"
                                )}>
                                    {date.getDate()}
                                </div>
                            </div>

                            {/* Activity Pills - Stacked */}
                            <div className="flex flex-col gap-1 items-center min-h-[24px]">
                                {dayWorkouts.length > 0 ? (
                                    dayWorkouts.map((w, idx) => {
                                        const cat = getCategoryFromTitle(w.title);
                                        return (
                                            <div key={idx} className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase whitespace-nowrap",
                                                getActivityColor(cat)
                                            )}>
                                                {getActivityLabel(cat)}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-8 h-1" /> // Spacer
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
