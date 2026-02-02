// API Service for Roxapp Frontend
// Connects to backend API on pialousport

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://100.107.228.60:3001';

// Generic fetch helpers
export const get = async (endpoint: string, params: any = {}) => {
    const url = new URL(`${API_BASE_URL}/api/${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`GET ${endpoint} failed`);
    return response.json();
};

export const post = async (endpoint: string, body: any = {}) => {
    const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`POST ${endpoint} failed`);
    return response.json();
};

export interface APIWorkout {
    id: string;
    title: string;
    category: string;
    session_date: string;
    status: string;
    planned_details: any;
    duration_minutes?: number;
}

export const apiService = {
    // Fetch workouts
    async getWorkouts(filters?: { date?: string; status?: string; }): Promise<APIWorkout[]> {
        const params = new URLSearchParams();
        if (filters?.date) params.append('date', filters.date);
        if (filters?.status) params.append('status', filters.status);

        const response = await fetch(`${API_BASE_URL}/api/workouts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch workouts');
        return response.json();
    },

    // Get single workout
    async getWorkout(id: string): Promise<APIWorkout> {
        const response = await fetch(`${API_BASE_URL}/api/workouts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch workout');
        return response.json();
    },

    // Complete workout
    async completeWorkout(
        id: string,
        data: {
            executedDetails: any;
            rpe?: number;
            durationMinutes?: number;
            athleteComments?: string;
        }
    ): Promise<APIWorkout> {
        const response = await fetch(`${API_BASE_URL}/api/workouts/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to complete workout');
        return response.json();
    },

    // Trigger n8n workflow
    async triggerWorkflow(workflowId: string, data: any): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/n8n/trigger/${workflowId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to trigger workflow');
        return response.json();
    },

    // Get athlete metrics
    async getAthleteMetrics(): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/api/athlete/metrics`);
        if (!response.ok) throw new Error('Failed to fetch metrics');
        return response.json();
    },

    // Get Strava activities
    async getStravaActivities(): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/api/strava/activities`);
        if (!response.ok) throw new Error('Failed to fetch Strava activities');
        return response.json();
    },

    // Get aggregated Strava stats (e.g., weekly totals)
    async getStravaStats(): Promise<{ total_distance_km: number, total_load: number, activity_count: number, history?: any[], loadHistory?: any[] }> {
        // DIRECT STRAVA MODE (if local env vars are set)
        const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
        const refreshToken = import.meta.env.VITE_STRAVA_REFRESH_TOKEN;

        if (clientId && clientSecret && refreshToken) {
            try {
                // 1. Refresh Token
                const tokenRes = await fetch(`https://www.strava.com/oauth/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: clientId,
                        client_secret: clientSecret,
                        refresh_token: refreshToken,
                        grant_type: 'refresh_token'
                    })
                });

                if (!tokenRes.ok) {
                    console.error("Strava Token Refresh Failed", await tokenRes.text());
                    throw new Error("Strava Token Refresh Failed");
                }

                const tokenData = await tokenRes.json();
                const accessToken = tokenData.access_token;

                // 2. Fetch Activities (Last 4 weeks = 28 days)
                const now = Math.floor(Date.now() / 1000);
                const fourWeeksAgo = now - (28 * 24 * 60 * 60);

                const activitiesRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${fourWeeksAgo}&per_page=100`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });

                if (!activitiesRes.ok) throw new Error("Strava Activities Fetch Failed");
                const activities = await activitiesRes.json();

                // 3. Aggregate Data
                // Week buckets: S-3, S-2, S-1, This (Week 0)
                // Logic: Calendar Weeks (Monday to Sunday)

                const historyMap = {
                    0: { distance: 0, load: 0, name: 'This' },
                    1: { distance: 0, load: 0, name: 'S-1' },
                    2: { distance: 0, load: 0, name: 'S-2' },
                    3: { distance: 0, load: 0, name: 'S-3' }
                };

                let currentWeekDistance = 0;
                let currentWeekLoad = 0;
                let activityCount = 0;

                // Calendar Week Helper
                const getMonday = (d: Date) => {
                    const date = new Date(d);
                    const day = date.getDay();
                    const diff = date.getDate() - (day === 0 ? 6 : day - 1);
                    const monday = new Date(date.setDate(diff));
                    monday.setHours(0, 0, 0, 0);
                    return monday;
                };

                const currentMonday = getMonday(new Date());
                const msPerWeek = 1000 * 60 * 60 * 24 * 7;

                // Activity Filter (Exclude Bike)
                const BANNED_TYPES = ['Ride', 'VirtualRide', 'EBikeRide', 'GravelRide', 'Velomobile'];

                activities.forEach((act: any) => {
                    // 1. Filter Type
                    if (BANNED_TYPES.includes(act.type)) return;

                    // 2. Identify Week
                    const actDate = new Date(act.start_date);
                    const actMonday = getMonday(actDate);

                    // weeksAgo: 0 = This Week, 1 = Last Week...
                    // Check if future?
                    if (actMonday.getTime() > currentMonday.getTime()) return;

                    const weeksAgo = Math.round((currentMonday.getTime() - actMonday.getTime()) / msPerWeek);

                    if (weeksAgo > 3) return; // Too old

                    const distKm = (act.distance || 0) / 1000;
                    const load = act.suffer_score || 0;

                    if (historyMap[weeksAgo as keyof typeof historyMap]) {
                        historyMap[weeksAgo as keyof typeof historyMap].distance += distKm;
                        historyMap[weeksAgo as keyof typeof historyMap].load += load;
                    }

                    if (weeksAgo === 0) {
                        currentWeekDistance += distKm;
                        currentWeekLoad += load;
                        activityCount++;
                    }
                });

                // Format for Recharts (Reverse order: S-3 -> This)
                const history = [
                    { name: 'S-3', val: parseFloat(historyMap[3].distance.toFixed(1)) },
                    { name: 'S-2', val: parseFloat(historyMap[2].distance.toFixed(1)) },
                    { name: 'S-1', val: parseFloat(historyMap[1].distance.toFixed(1)) },
                    { name: 'This', val: parseFloat(historyMap[0].distance.toFixed(1)) }
                ];

                const loadHistory = [
                    { name: 'S-3', val: historyMap[3].load },
                    { name: 'S-2', val: historyMap[2].load },
                    { name: 'S-1', val: historyMap[1].load },
                    { name: 'This', val: historyMap[0].load }
                ];

                return {
                    total_distance_km: currentWeekDistance,
                    total_load: currentWeekLoad,
                    activity_count: activityCount,
                    history,
                    loadHistory
                };

            } catch (err) {
                console.error("Direct Strava Error:", err);
                return { total_distance_km: 0, total_load: 0, activity_count: 0, history: [], loadHistory: [] };
            }
        }

        // BACKEND FALLBACK
        const response = await fetch(`${API_BASE_URL}/api/strava/activities?type=weekly_stats`);
        if (!response.ok) throw new Error('Failed to fetch Strava stats');
        const data = await response.json();
        // Add empty history if missing
        return {
            ...data,
            history: [],
            loadHistory: []
        };
    },
};
