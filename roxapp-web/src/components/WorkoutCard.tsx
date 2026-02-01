import { Play, Timer, Dumbbell, Footprints } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface WorkoutCardProps {
    title: string
    duration: string
    category: "Run" | "Hyrox" | "CrossFit" | "Renfo/Muscu"
    intensity?: number
    isFeatured?: boolean
    onStartSession?: () => void
}

export function WorkoutCard({ title, duration, category, intensity, isFeatured, onStartSession }: WorkoutCardProps) {
    const isRun = category === "Run"
    const isHyrox = category === "Hyrox"
    const isCrossFit = category === "CrossFit"

    const accentColor = isRun ? "text-green-500" : (isHyrox ? "text-red-500" : (isCrossFit ? "text-orange-500" : "text-blue-500"))
    const bgGradient = isFeatured
        ? (isRun
            ? "bg-gradient-to-br from-green-500/20 via-background to-background border-green-500/50"
            : (isHyrox
                ? "bg-gradient-to-br from-red-500/20 via-background to-background border-red-500/50"
                : "bg-gradient-to-br from-orange-500/20 via-background to-background border-orange-500/50"))
        : "bg-card/50 hover:bg-card/80 transition-colors border-border/50"

    const Icon = isRun ? Footprints : (isHyrox || isCrossFit ? Timer : Dumbbell)

    return (
        <Card className={cn("overflow-hidden backdrop-blur-sm border", bgGradient)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className={cn("uppercase text-xs font-bold tracking-wider", accentColor, "border-current bg-background/50")}>
                        {category}
                    </Badge>
                    {intensity && (
                        <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={cn("w-1 h-3 rounded-full", i < (intensity > 7 ? 3 : intensity > 4 ? 2 : 1) ? accentColor : "bg-muted/30")} />
                            ))}
                        </div>
                    )}
                </div>
                <CardTitle className="leading-tight mt-2 text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    <span>{duration}</span>
                </div>
            </CardContent>
            {isFeatured && (
                <CardFooter className="pt-2">
                    <Button
                        onClick={onStartSession}
                        className={cn(
                            "w-full gap-2 font-bold shadow-lg",
                            isRun ? "bg-green-600 hover:bg-green-700 text-white" :
                                isHyrox ? "bg-red-600 hover:bg-red-700 text-white" :
                                    isCrossFit ? "bg-orange-600 hover:bg-orange-700 text-white" :
                                        "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                    >
                        <Play className="w-4 h-4 fill-current" />
                        START SESSION
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
