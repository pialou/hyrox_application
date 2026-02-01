import { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Footprints, Zap } from 'lucide-react';

type WidgetType = "distance" | "load";

interface StatsWidgetProps {
    type: WidgetType;
    value: string | number;
    unit?: string;
    label: string;
    subtext: string;
}

const distanceData = [
    { name: 'S-3', val: 32 },
    { name: 'S-2', val: 45 },
    { name: 'S-1', val: 38 },
    { name: 'This', val: 17.1 },
];

const loadData = [
    { name: 'S-3', val: 350 },
    { name: 'S-2', val: 420 },
    { name: 'S-1', val: 380 },
    { name: 'This', val: 410 },
];

export function StatsWidget({ type, value, unit, label, subtext }: StatsWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Config based on type
    const isDistance = type === "distance";
    const Icon = isDistance ? Footprints : Zap;
    const data = isDistance ? distanceData : loadData;
    const barColor = isDistance ? "#22c55e" : "#3b82f6"; // Green for run, Blue for load

    return (
        <>
            <Card
                className="bg-card/40 backdrop-blur border-white/5 hover:bg-white/5 transition-all cursor-pointer group active:scale-95 duration-200"
                onClick={() => setIsOpen(true)}
            >
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{label}</span>
                    </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">{value}</span>
                        {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
                </CardContent>
            </Card>

            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerContent className="bg-background border-t border-white/10">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                            <DrawerTitle>{label} - Évolution</DrawerTitle>
                            <DrawerDescription>
                                Historique sur les 4 dernières semaines.
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0 h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar
                                        dataKey="val"
                                        fill={barColor}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <DrawerFooter>
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="w-full flex-1" onClick={() => { }}>1 Mois</Button>
                                <Button variant="outline" className="w-full flex-1" onClick={() => { }}>3 Mois</Button>
                                <Button variant="outline" className="w-full flex-1" onClick={() => { }}>6 Mois</Button>
                            </div>
                            <DrawerClose asChild>
                                <Button variant="ghost">Fermer</Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
}
