import { Home as HomeIcon, Dumbbell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black/40 backdrop-blur-xl border border-white/10 rounded-full h-16 px-6 flex items-center justify-between shadow-2xl z-50">
            <NavItem
                icon={HomeIcon}
                label="Dashboard"
                isActive={location.pathname === "/"}
                onClick={() => navigate("/")}
            />
            <NavItem
                icon={Dumbbell}
                label="Séances"
                isActive={location.pathname === "/workouts"}
                onClick={() => navigate("/workouts")}
            />

        </div>
    );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive?: boolean, onClick: () => void }) {
    return (
        <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer group">
            <Icon className={cn("w-6 h-6 transition-colors", isActive ? "text-primary fill-primary/20" : "text-muted-foreground group-hover:text-white")} />
            <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")}>
                {label}
            </span>
        </div>
    );
}
