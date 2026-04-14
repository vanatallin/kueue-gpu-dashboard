# Kueue GPU Dashboard

Interactive GPU cluster management dashboard for monitoring resource utilization, workload scheduling, and quota management. Built for [Kubernetes Kueue](https://kueue.sigs.k8s.io/) with OpenShift OAuth integration.

![Vite](https://img.shields.io/badge/vite-8-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/react-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   React Frontend    │────▶│   Express Backend   │────▶│   OpenShift API     │
│   (Vite, port 5173) │     │   (Node.js, 3001)   │     │   + Kueue CRDs      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────────┐
                            │   OpenShift OAuth   │
                            │   (User Login)      │
                            └─────────────────────┘
```

## Features

| Screen | Description |
|--------|-------------|
| **Cluster Control** | Metric cards, recommendations, GPU topology view, workload table |
| **Cluster Queues** | Tiles for each ClusterQueue grouped by cohort with GPU quotas and workload stats |
| **Resource Monitor** | GPU efficiency gauge, utilization donut, memory heatmap, pool usage charts |
| **Nodes** | Node listing with GPU count and health status |
| **Workloads** | Full workload table with status, priority, and progress |
| **Quotas** | Quota hierarchy tree with borrowing/lending limits |
| **Settings** | Auto-refresh interval, demo mode, and copilot toggles |

---

## Prerequisites

- **Node.js** 20+ and npm
- **OpenShift** cluster with:
  - [Kueue](https://kueue.sigs.k8s.io/) installed
  - Admin access to create OAuthClient resources
- **oc CLI** logged into the cluster

---

## Local Development Setup

### Step 1: Configure OpenShift OAuth

Create an OAuthClient resource in your OpenShift cluster to enable "Login with OpenShift":

```bash
# Edit the OAuth client configuration
cat > server/openshift-oauth-client.yaml << 'EOF'
apiVersion: oauth.openshift.io/v1
kind: OAuthClient
metadata:
  name: kueue-dashboard
grantMethod: auto
secret: <generate-a-random-secret>
redirectURIs:
  - http://localhost:3001/auth/callback
EOF

# Generate a random secret
openssl rand -base64 32

# Apply to your cluster
oc apply -f server/openshift-oauth-client.yaml
```

### Step 2: Configure Backend Environment

```bash
cd server

# Copy the example environment file
cp .env.example .env

# Edit .env with your values:
```

Edit `server/.env`:
```bash
# OpenShift API URL (get with: oc whoami --show-server)
OPENSHIFT_API_URL=https://api.your-cluster.example.com:6443

# OAuth Client credentials (must match OAuthClient resource)
OAUTH_CLIENT_ID=kueue-dashboard
OAUTH_CLIENT_SECRET=<the-secret-from-step-1>

# OAuth callback URL
OAUTH_CALLBACK_URL=http://localhost:3001/auth/callback

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=<random-session-secret>

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Server port
PORT=3001
```

### Step 3: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 4: Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and click "Login with OpenShift".

---

## OpenShift Deployment

### Step 1: Create or Select Project

```bash
oc new-project <your-project>
```

Or select an existing project:

```bash
oc project <your-project>
```

### Step 2: Build and Push Container Images

> **Note:** If building on Apple Silicon (M1/M2/M3), you must specify `--platform linux/amd64` since OpenShift nodes run on x86_64. Without this flag the containers will fail with `Exec format error`.

```bash
# Build for amd64 (required when building on ARM Macs)
docker build --platform linux/amd64 -t quay.io/<your-org>/kueue-dashboard-frontend:latest -f deploy/docker/Dockerfile.frontend .
docker build --platform linux/amd64 -t quay.io/<your-org>/kueue-dashboard-backend:latest -f deploy/docker/Dockerfile.backend .

# Push images
docker push quay.io/<your-org>/kueue-dashboard-frontend:latest
docker push quay.io/<your-org>/kueue-dashboard-backend:latest
```

Update the image references in `deploy/openshift/deployment-frontend.yaml` and `deploy/openshift/deployment-backend.yaml` to match your registry path.

### Step 3: Create Image Pull Secret

If your container images are in a private registry, create a pull secret:

```bash
oc create secret docker-registry quay-pull-secret \
  --docker-server=quay.io \
  --docker-username=<your-quay-username> \
  --docker-password=<your-quay-password-or-token>
```

Or use your existing Docker credentials:

```bash
oc create secret docker-registry quay-pull-secret \
  --from-file=.dockerconfigjson=$HOME/.docker/config.json \
  --type=kubernetes.io/dockerconfigjson
```

### Step 4: Create ServiceAccount and RBAC

```bash
oc apply -f deploy/openshift/serviceaccount.yaml
oc apply -f deploy/openshift/rbac.yaml
```

Update the namespace in `deploy/openshift/rbac.yaml` to match your project before applying:

```yaml
subjects:
  - kind: ServiceAccount
    name: kueue-dashboard
    namespace: <your-project>
```

### Step 5: Deploy Services and Route

```bash
oc apply -f deploy/openshift/service.yaml
oc apply -f deploy/openshift/route.yaml
```

Get the route hostname (you'll need it for the next steps):

```bash
oc get route kueue-dashboard -o jsonpath='{.spec.host}'
```

### Step 6: Configure OAuth for Production

Create an OAuthClient with the production redirect URI. The `secret` value must be a random string — save it for the next step:

```bash
OAUTH_SECRET=$(openssl rand -base64 32)
ROUTE_HOST=$(oc get route kueue-dashboard -o jsonpath='{.spec.host}')

cat << EOF | oc apply -f -
apiVersion: oauth.openshift.io/v1
kind: OAuthClient
metadata:
  name: kueue-dashboard
grantMethod: auto
secret: ${OAUTH_SECRET}
redirectURIs:
  - https://${ROUTE_HOST}/auth/callback
EOF

echo "OAuth secret: ${OAUTH_SECRET}"
```

> **Important:** The `redirectURIs` must exactly match the route URL including the `/auth/callback` path. If the URL doesn't match, OAuth login will fail with "invalid_request".

### Step 7: Create Secret and ConfigMap

Create the backend secret using the OAuth secret from the previous step:

```bash
ROUTE_HOST=$(oc get route kueue-dashboard -o jsonpath='{.spec.host}')

oc create secret generic kueue-dashboard-config \
  --from-literal=OAUTH_CLIENT_ID=kueue-dashboard \
  --from-literal=OAUTH_CLIENT_SECRET=<oauth-secret-from-step-6> \
  --from-literal=SESSION_SECRET=$(openssl rand -base64 32)
```

Update `deploy/openshift/configmap.yaml` with your route hostname, then apply:

```yaml
data:
  OAUTH_CALLBACK_URL: "https://<route-host>/auth/callback"
  FRONTEND_URL: "https://<route-host>"
```

```bash
oc apply -f deploy/openshift/configmap.yaml
```

### Step 8: Deploy Application

```bash
oc apply -f deploy/openshift/deployment-backend.yaml
oc apply -f deploy/openshift/deployment-frontend.yaml
```

### Step 9: Verify Deployment

```bash
# Check pods are running
oc get pods -l app=kueue-dashboard

# Check route
oc get route kueue-dashboard

# View logs
oc logs -f deployment/kueue-dashboard-backend
oc logs -f deployment/kueue-dashboard-frontend
```

Open `https://<route-host>` in your browser and click "Login with OpenShift".

---

## Configuration Reference

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `OPENSHIFT_API_URL` | OpenShift API URL | Auto-detected in-cluster |
| `OAUTH_CLIENT_ID` | OAuthClient name | `kueue-dashboard` |
| `OAUTH_CLIENT_SECRET` | OAuthClient secret | Required |
| `OAUTH_CALLBACK_URL` | OAuth redirect URI | `http://localhost:3001/auth/callback` |
| `SESSION_SECRET` | Express session secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS/redirects | `http://localhost:5173` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (set in `.env` for local dev, empty in Docker for relative paths via nginx proxy) | Empty (relative paths) |

---

## Project Structure

```
├── src/                        # Frontend source
│   ├── pages/                  # Top-level screens
│   │   ├── ClusterControl.tsx
│   │   ├── ClusterQueues.tsx   # ClusterQueue tiles by cohort
│   │   ├── ResourcePools.tsx   # GPU monitoring dashboard
│   │   ├── Nodes.tsx
│   │   ├── Workloads.tsx
│   │   ├── Quotas.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── charts/             # Custom SVG visualizations
│   │   ├── layout/             # AppShell, Sidebar, TopBar
│   │   ├── ui/                 # Button, ProgressBar, etc.
│   │   └── ...
│   ├── context/                # React contexts
│   │   ├── AuthContext.tsx     # OpenShift OAuth state
│   │   ├── SettingsContext.tsx # App settings
│   │   └── RefreshContext.tsx  # Auto-refresh state
│   ├── hooks/
│   │   └── useKueueData.ts     # Data fetching hooks
│   ├── services/
│   │   └── api.ts              # Backend API client
│   └── types/
│       └── kueue.ts            # TypeScript interfaces
│
├── server/                     # Backend source
│   ├── src/
│   │   ├── index.ts            # Express app entry
│   │   ├── config.ts           # Environment config
│   │   ├── middleware/
│   │   │   └── auth.ts         # Session auth middleware
│   │   ├── routes/
│   │   │   ├── auth.ts         # OAuth routes
│   │   │   ├── workloads.ts    # /api/workloads
│   │   │   ├── queues.ts       # /api/clusterqueues, /api/localqueues, /api/quotas
│   │   │   └── nodes.ts        # /api/nodes, /api/nodes/metrics
│   │   └── services/
│   │       └── kube.ts         # Kubernetes API client
│   ├── .env.example
│   └── package.json
│
└── deploy/                     # Deployment files
    ├── docker/
    │   ├── Dockerfile.frontend
    │   └── Dockerfile.backend
    └── openshift/
        ├── deployment-frontend.yaml
        ├── deployment-backend.yaml
        ├── service.yaml
        ├── route.yaml
        ├── configmap.yaml
        ├── serviceaccount.yaml
        └── rbac.yaml
```

---

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript |
| `npm run start` | Run compiled JS |

---

## Demo Mode

The app includes a demo simulation mode (enable in Settings) that shows GPU workload scheduling:

1. **Steady State** - Cluster running normally
2. **High-Priority Arrival** - New workload needs more GPUs than available
3. **Preemption** - Low-priority workload suspended for high-priority
4. **Completion & Resume** - High-priority finishes, suspended workload resumes

---

## Troubleshooting

### OAuth Login Fails

1. Verify OAuthClient exists: `oc get oauthclient kueue-dashboard -o yaml`
2. Check `redirectURIs` exactly matches your route: `https://<route-host>/auth/callback`
3. Verify `OAUTH_CLIENT_SECRET` in the `kueue-dashboard-config` secret matches the OAuthClient `secret` field
4. Check the OAuth discovery endpoint: `curl -k "$(oc whoami --show-server)/.well-known/oauth-authorization-server"`

### Image Pull Fails

1. Verify pull secret exists: `oc get secret quay-pull-secret`
2. Test credentials locally: `docker login quay.io`
3. Recreate from working Docker config: `oc create secret docker-registry quay-pull-secret --from-file=.dockerconfigjson=$HOME/.docker/config.json --type=kubernetes.io/dockerconfigjson`

### Pods Crash with Exec Format Error

Images were built for the wrong CPU architecture. Rebuild with `--platform linux/amd64`.

### Pods Fail with SCC / SecurityContext Errors

OpenShift assigns UIDs from a namespace-specific range. Do not set `runAsUser` to fixed values like `1001` or `101`. Remove `runAsUser` and let OpenShift assign a UID. The Dockerfiles use `chgrp -R 0` and `chmod -R g=u` to allow arbitrary UIDs.

### API Calls Fail

1. Check backend logs: `oc logs deployment/kueue-dashboard-backend`
2. Verify RBAC permissions: `oc auth can-i get workloads.kueue.x-k8s.io --as=system:serviceaccount:<your-project>:kueue-dashboard`
3. For local dev, ensure `OPENSHIFT_API_URL` is correct in `server/.env`

### Frontend Makes Requests to localhost

The `VITE_API_URL` is baked in at build time. For production Docker builds, the Dockerfile sets `ENV VITE_API_URL=""` so all API requests use relative paths, which nginx proxies to the backend service. If the frontend still hits `localhost:3001`, rebuild the Docker image.

### CORS Errors

1. Verify `FRONTEND_URL` in the configmap matches the actual route URL
2. For production, ensure the route is using HTTPS

---

## License

MIT
