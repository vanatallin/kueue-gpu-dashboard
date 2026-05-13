import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import workloadsRoutes from './routes/workloads.js';
import queuesRoutes from './routes/queues.js';
import nodesRoutes from './routes/nodes.js';

const app = express();

// CORS configuration
// In development, allow any localhost port since Vite may pick a different port
const corsOrigin =
  process.env.NODE_ENV === 'production'
    ? config.frontendUrl
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (e.g., curl, Postman)
        if (!origin) {
          callback(null, true);
          return;
        }
        // Allow any localhost port in development
        if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      };

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    },
  })
);

// JSON body parser
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', inCluster: config.isInCluster });
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/workloads', workloadsRoutes);
app.use('/api', queuesRoutes);
app.use('/api/nodes', nodesRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Mode: ${config.isInCluster ? 'in-cluster' : 'local'}`);
  console.log(`OpenShift API: ${config.openshiftApiUrl || 'NOT CONFIGURED'}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});
