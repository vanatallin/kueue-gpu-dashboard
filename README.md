# Kueue — GPU Dashboard

Interactive GPU cluster management dashboard for monitoring resource utilization, workload scheduling, and quota management. Inspired by [Run:AI](https://run.ai)'s GPU monitoring interface and [Kubernetes Kueue](https://kueue.sigs.k8s.io/).

![Vite](https://img.shields.io/badge/vite-8-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

## Screens

| Screen | Description |
|--------|-------------|
| **Cluster Control** | Metric cards, recommendations, action bar, GPU topology view, workload table |
| **Resource Pools** | GPU efficiency gauge, utilization donut, memory heatmap, pool usage charts, vendor breakdown |
| **Workloads** | Full workload table with event log |
| **Quotas** | Quota hierarchy tree/table with editing panel |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 8** for dev/build
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Framer Motion** for animations
- **Lucide React** for icons
- All charts are custom SVG/CSS — no charting library dependencies

## Project Structure

```
src/
├── pages/                  # Top-level screens
│   ├── ClusterControl.tsx  # Main dashboard
│   ├── ResourcePools.tsx   # GPU monitoring dashboard
│   ├── Workloads.tsx       # Workload management
│   └── Quotas.tsx          # Quota hierarchy
├── components/
│   ├── charts/             # Visualization components
│   │   ├── GaugeChart.tsx       # SVG speedometer gauge
│   │   ├── DonutChart.tsx       # SVG donut ring
│   │   ├── HeatmapGrid.tsx     # CSS grid heatmap
│   │   ├── HorizontalBarChart.tsx
│   │   └── GpuVendorChart.tsx
│   ├── layout/             # App shell, sidebar, top bar
│   ├── cards/              # Metric and recommendation cards
│   ├── topology/           # GPU topology visualization
│   ├── workloads/          # Workload table
│   ├── quotas/             # Quota tree/table
│   ├── wizard/             # Pool creation modal
│   ├── copilot/            # AI copilot panel
│   ├── demo/               # Demo controls
│   ├── actions/            # Action bar
│   └── ui/                 # Primitives (Button, ProgressBar, etc.)
├── context/                # Demo simulation context
├── hooks/                  # Simulation hook
├── data/                   # Mock data
│   ├── mock.ts             # Demo state data
│   ├── quotas.ts           # Quota hierarchy data
│   └── resourcePools.ts   # Resource pool metrics
├── types/                  # TypeScript interfaces
└── styles/                 # Design tokens (tokens.css)
```

## Demo Mode

The app runs a 4-step demo simulation showing GPU workload scheduling:

1. **Steady State** — Cluster running normally
2. **High-Priority Arrival** — New workload needs more GPUs than available
3. **Preemption** — Low-priority workload suspended for high-priority
4. **Completion & Resume** — High-priority finishes, suspended workload resumes

Use the control bar at the bottom to step through the demo.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## License

MIT
