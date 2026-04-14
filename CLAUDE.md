# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend
npm run dev      # Start dev server at localhost:5173
npm run build    # Type-check (tsc -b) + production build (vite build)
npm run lint     # Run ESLint

# Backend (server/)
cd server && npm install
cd server && npm run dev    # Start API server at localhost:3001 (tsx watch, hot-reload)
cd server && npm run build  # Compile TypeScript to dist/
```

No test framework is configured. There are no test files in the project.

## Overview

GPU cluster management dashboard for Kubernetes Kueue. React 19 SPA with Vite 8, TypeScript 5.9, and Tailwind CSS v4. All charts are custom SVG/CSS — no charting library. Animations use Framer Motion. Icons from Lucide React. No UI component library — all components are custom-built.

## Architecture

### Data Flow: Demo Mode vs Live API

The app has two data modes controlled by `SettingsContext`:

1. **Demo mode** (default): Data comes from `DemoContext` → `useDemoSimulation` hook → static snapshots in `src/data/mock.ts` (DEMO_STATES). The demo has 4 steps: steady state → high-priority arrival → preemption → completion & resume.

2. **Live mode**: Data fetched from the Express backend via `src/services/api.ts` using `useKueueData` hooks. The API client uses `fetch` with `credentials: 'include'` for session cookies. Base URL configured via `VITE_API_URL` env var (default: `http://localhost:3001`).

Pages check settings context to decide which data source to use.

### Context Provider Stack

Providers are nested in `App.tsx` in this order (outermost first):
`AuthProvider` → `SettingsProvider` → `RefreshProvider` → `DemoProvider` → `SearchProvider`

Key contexts:
- **AuthContext**: OpenShift OAuth login state, `login()`/`logout()`/`checkAuth()`
- **SettingsContext**: Persists to localStorage — auto-refresh, demo mode, copilot toggles
- **RefreshContext**: Coordinates data refresh triggers across components
- **DemoContext**: Wraps `useDemoSimulation` — 4-step demo state machine with play/pause
- **SearchContext**: Global search query state

### Routing

No router library. `App.tsx` uses `useState('cluster')` for page selection. Pages: `cluster`, `clusterqueues`, `workloads`, `quotas`, `pools`, `nodes`, `metrics`, `settings`. Navigation handled by `Sidebar` calling `onNavigate`.

### Page Structure
- **ClusterControl**: Main dashboard — metric cards, recommendations, GPU topology, workload summary
- **ClusterQueues**: ClusterQueue tiles grouped by cohort with GPU quotas and workload stats
- **ResourcePools**: GPU efficiency gauge, utilization donut, memory heatmap, pool usage charts
- **Nodes**: Node listing with GPU count and health
- **Workloads**: Full workload table with event log
- **Quotas**: Hierarchical quota tree/table with edit panel
- **Metrics**: Advanced metrics dashboard
- **Settings**: Auto-refresh, demo mode, copilot toggles

### Design System

Design tokens in `src/styles/tokens.css` using Tailwind v4 `@theme` directive. Color naming:
- Backgrounds: `bg`, `surface`, `surface-2`, `border`
- Semantic: `primary` (purple), `compute` (blue), `memory` (green), `warning` (orange), `critical` (red)
- Status: `status-running`, `status-pending`, `status-preempted`, `status-completed`, `status-resuming`

### Custom Charts (src/components/charts/)

All visualizations built from scratch — SVG and CSS, no charting library:
- `GaugeChart`: SVG arc-based speedometer
- `DonutChart`: SVG ring chart
- `HeatmapGrid`: CSS grid with color interpolation
- `HorizontalBarChart`: Stacked horizontal bars

### Backend (server/)

Express.js API server with OpenShift OAuth. Auto-detects in-cluster mode by checking for `/var/run/secrets/kubernetes.io/serviceaccount/token`.

Routes:
- `/auth/*`: OAuth login/callback/logout/me
- `/api/workloads`: Transforms Kueue WorkloadList CRD to frontend format
- `/api/clusterqueues`, `/api/localqueues`, `/api/quotas`: Queue hierarchy
- `/api/nodes`, `/api/nodes/metrics`: Node GPU info

`server/src/services/kube.ts`: Axios-based Kubernetes API client using Bearer token auth. Kueue CRDs accessed via `/apis/kueue.x-k8s.io/v1beta1/*`.

Backend requires `server/.env` configuration (see `server/.env.example`): `OPENSHIFT_API_URL`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `SESSION_SECRET`, `FRONTEND_URL`.

### Deployment

OpenShift manifests in `deploy/openshift/` (Deployments, Services, Route, RBAC, ServiceAccount). Dockerfiles in `deploy/docker/` with nginx reverse proxy for frontend.

### Key Types

`src/types/kueue.ts` defines the domain model: `Workload`, `GpuPool`, `QuotaNode`, `ClusterMetrics`, `DemoState`. Workload statuses: `running | pending | preempted | completed | resuming`. Priorities: `low | high`.
