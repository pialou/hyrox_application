import { cn } from "@/lib/utils"

type ActivityType = "Run" | "Hyrox" | "Renfo";

type DayStatus = {
    day: string; // "L", "M", "M", "J", "V", "S", "D"
    date: number;
    isToday?: boolean;
    activity?: ActivityType;
}

export function WeeklyCalendar() {
    const days: DayStatus[] = [
        { day: "L", date: 22 },
        { day: "M", date: 23, activity: "Run" },
        { day: "M", date: 24, activity: "Run" },
        { day: "J", date: 25, activity: "Hyrox", isToday: true },
        { day: "V", date: 26, activity: "Run" },
        { day: "S", date: 27, activity: "Run" },
        { day: "D", date: 28, activity: "Renfo" },
    ]

    const getActivityColor = (type?: ActivityType) => {
        switch (type) {
            case "Run": return "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]";
            case "Hyrox": return "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]";
            case "Renfo": return "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]";
            default: return "bg-transparent";
        }
    }

    const getActivityLabel = (type?: ActivityType) => {
        switch (type) {
            case "Run": return "Run";
            case "Hyrox": return "HYX";
            case "Renfo": return "REN";
            default: return "";
        }
    }

    return (
        <div className="w-full bg-card/50 backdrop-blur-md rounded-3xl p-4 border border-white/5">
            <h2 className="text-xl font-bold mb-4 pl-2">Ma semaine</h2>
            <div className="flex justify-between items-start">
                {days.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-3">
                        {/* Day & Date */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                                d.isToday
                                    ? "bg-red-400 text-white shadow-[0_0_10px_rgba(248,113,113,0.5)] scale-110"
                                    : "bg-secondary text-secondary-foreground"
                            )}>
                                {d.date}
                            </div>
                        </div>

                        {/* Activity Pill */}
                        <div className="h-6 flex items-center justify-center">
                            {d.activity ? (
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase",
                                    getActivityColor(d.activity)
                                )}>
                                    {getActivityLabel(d.activity)}
                                </div>
                            ) : (
                                <div className="w-8 h-6" /> // Spacer
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Extra row for second activity if needed (mocked purely for visual balance as per image) */}
            <div className="flex justify-between items-start mt-1">
                {/* Just mocking the "REN" under Sunday from the image example */}
                <div className="w-full grid grid-cols-7 gap-0">
                    <span className="col-span-6"></span>
                    <div className="flex justify-center">
                        {/* <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">REN</div> */}
                    </div>
                </div>
            </div>
        </div>
    )
}
