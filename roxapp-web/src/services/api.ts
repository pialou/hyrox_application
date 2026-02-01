// API Service for Roxapp Frontend
// Connects to backend API on pialousport

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://100.107.228.60:3001';

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
    async getStravaStats(): Promise<{ total_distance_km: number, total_load: number, activity_count: number }> {
        const response = await fetch(`${API_BASE_URL}/api/strava/activities?type=weekly_stats`);
        if (!response.ok) throw new Error('Failed to fetch Strava stats');
        return response.json();
    },
};
