# Strava Integration Directive

## Overview
The application integrates with Strava to fetch athlete statistics (Distance, Suffer Score) and display them on the Dashboard in weekly buckets.

## Configuration
Host: Vercel / Localhost
Environment Variables (Required):
- `VITE_STRAVA_CLIENT_ID`: Strava Application Client ID (e.g. `190950`)
- `VITE_STRAVA_CLIENT_SECRET`: Client Secret
- `VITE_STRAVA_REFRESH_TOKEN`: Long-lived refresh token with `activity:read` scope.

## Authentication Flow (Direct Mode)
The frontend (`api.ts`) communicates directly with Strava API to avoid backend dependency for this feature.
1. **Refresh Token Exchange**: App sends `refresh_token` to `https://www.strava.com/oauth/token`.
2. **Access Token**: Received and used for subsequent requests.

## Data Fetching & Aggregation
### Endpoint
- `GET https://www.strava.com/api/v3/athlete/activities`
- Params: `after` (4 weeks ago), `per_page=100`.

### Filtering Logic
- **Allowed Types**: `Run`, `CrossFit`, `WeightTraining`, `Workout`.
- **Excluded Types**: `Ride`, `VirtualRide`, `EBikeRide`, `GravelRide`, `Velomobile`.

### Aggregation Logic (Calendar Week)
- **Week Definition**: Monday 00:00 to Sunday 23:59.
- **Buckets**:
  - **This Week (S-0)**: Current calendar week (Monday -> Now).
  - **S-1, S-2, S-3**: Previous calendar weeks.
- **Metrics**:
  - `total_distance_km`: Sum of distance (converted to km).
  - `total_load`: Sum of `suffer_score` (Relative Effort).

## Troubleshooting
- **401 Unauthorized**: Check if `VITE_STRAVA_REFRESH_TOKEN` is valid and has `activity:read` scope.
- **Missing Data (Monday)**: Ensure Date Filtering in `Workouts.tsx` or `api.ts` includes "Yesterday" to account for timezone shifts if necessary (e.g. UTC vs Local).
