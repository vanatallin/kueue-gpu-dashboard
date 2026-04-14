import { readFileSync, existsSync } from 'fs';

const IN_CLUSTER_TOKEN_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/token';
const IN_CLUSTER_CA_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt';
const IN_CLUSTER_NAMESPACE_PATH = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';

export interface Config {
  port: number;
  isInCluster: boolean;
  openshiftApiUrl: string;
  oauthClientId: string;
  oauthClientSecret: string;
  oauthCallbackUrl: string;
  sessionSecret: string;
  frontendUrl: string;
  serviceAccountToken?: string;
  caCert?: string;
  namespace?: string;
}

function detectInCluster(): boolean {
  return existsSync(IN_CLUSTER_TOKEN_PATH);
}

function readInClusterConfig(): Partial<Config> {
  if (!detectInCluster()) {
    return {};
  }

  const token = readFileSync(IN_CLUSTER_TOKEN_PATH, 'utf-8').trim();
  const caCert = readFileSync(IN_CLUSTER_CA_PATH, 'utf-8');
  const namespace = readFileSync(IN_CLUSTER_NAMESPACE_PATH, 'utf-8').trim();

  return {
    serviceAccountToken: token,
    caCert,
    namespace,
    openshiftApiUrl: 'https://kubernetes.default.svc',
  };
}

export function loadConfig(): Config {
  const isInCluster = detectInCluster();
  const inClusterConfig = readInClusterConfig();

  const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    isInCluster,
    openshiftApiUrl: process.env.OPENSHIFT_API_URL || inClusterConfig.openshiftApiUrl || '',
    oauthClientId: process.env.OAUTH_CLIENT_ID || 'kueue-dashboard',
    oauthClientSecret: process.env.OAUTH_CLIENT_SECRET || '',
    oauthCallbackUrl: process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001/auth/callback',
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    ...inClusterConfig,
  };

  if (!config.openshiftApiUrl) {
    console.warn('Warning: OPENSHIFT_API_URL not set. API calls will fail.');
  }

  return config;
}

export const config = loadConfig();
