# Frontend Specification - Hyrox Intel

## Design System
- **Theme**: "Apple Dark"
- **Colors**:
    - Background: `#000000` (Pure Dark) / `#1C1C1E` (Surface)
    - Accents: `#30D158` (Activity Green), `#FF453A` (Hyrox Red), `#0A84FF` (Blue)
    - Text: SF Pro (System Font), White primary.
- **Framework**: React + TailwindCSS.
- **Components**: Shadcn/ui (Radix) for premium feel.

## Pages

### 1. Home (Dashboard)
- **Header**: Bonjour {Name}, Prochaine séance.
- **Weekly Calendar strip**: L M M J V S D (Status dots/squares).
- **Workout List**: Vertical scroll. Cards with:
    - Icon/Color (Category)
    - Title + Duration
    - Status (Planned/Done)
    - **Interaction**: Click opens **Workout Detail** (Preview), then "Start" launches Player.
- **Stats Widgets**: Real-time Strava Data (Distance, Charge) via Direct API (Run/Fitness only).
- **Floater**: "Start [Session Name]" (Sticky bottom/top).

### 2. Workout Player (`/player/:id`)
- **Fullscreen**.
- **Header**: Timer (Huge), Round counter.
- **Center**: Current Movement (Video/GIF optional later?), Reps.
- **Footer**: "Next" (Big button), "Pause".
- **Logic**: State machine handling intervals.

### 3. Statistics (`/stats`)
- **Load Graph**: Recharts AreaChart (Training Load vs Capacity).
- **Distribution**: Pie chart (Run vs Hyrox vs Strength).

### 4. Coach AI (`/coach`)
- **Interface**: Chat bubble style (iMessage like).
- **Input**: Text + Mic button (Voice).

## Technical Requirements

### State Management
- `Zustand` or `React Context` for Player state.
- `TanStack Query` for data fetching (auto-refresh).

### PWA
- Manifest for installability.
- Service Workers for offline cache (Player must work offline!).

### Audio
- Web Audio API or simple HTML5 Audio for beeps.
- `SpeechSynthesis` API for announcements.

## Deployment (Self-Hosted)
- **Host**: `pialousport` (Linux Server).
- **URL**: `http://100.107.228.60:4173` (Tailscale Network).
- **Process Manager**: `pm2` (name: `hyrox-app`).
- **Update Strategy**: Run `sh deploy_server.sh` from local machine.
