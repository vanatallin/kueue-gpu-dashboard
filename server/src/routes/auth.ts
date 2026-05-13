import { Router, Request, Response } from 'express';
import axios from 'axios';
import https from 'https';
import { config } from '../config.js';

const router = Router();

// OpenShift OAuth endpoints - discovered from the API server's well-known metadata
let cachedOAuthUrls: { authorize: string; token: string; userInfo: string } | null = null;

async function getOAuthUrls() {
  if (cachedOAuthUrls) {
    return cachedOAuthUrls;
  }

  try {
    // Discover OAuth endpoints from the API server
    const response = await axios.get(
      `${config.openshiftApiUrl}/.well-known/oauth-authorization-server`,
      { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
    );
    cachedOAuthUrls = {
      authorize: response.data.authorization_endpoint,
      token: response.data.token_endpoint,
      userInfo: `${config.openshiftApiUrl}/apis/user.openshift.io/v1/users/~`,
    };
    console.log('Discovered OAuth endpoints from API server');
  } catch (err) {
    // Fallback: construct from API URL pattern
    const apiUrl = new URL(config.openshiftApiUrl);
    const clusterDomain = apiUrl.hostname.replace(/^api\./, '');
    const oauthHost = `oauth-openshift.apps.${clusterDomain}`;
    cachedOAuthUrls = {
      authorize: `https://${oauthHost}/oauth/authorize`,
      token: `https://${oauthHost}/oauth/token`,
      userInfo: `${config.openshiftApiUrl}/apis/user.openshift.io/v1/users/~`,
    };
    console.warn('Failed to discover OAuth endpoints, using fallback pattern:', (err as Error).message);
  }

  return cachedOAuthUrls;
}

// GET /auth/login - Redirect to OpenShift OAuth
router.get('/login', async (req: Request, res: Response) => {
  // Store the frontend origin for redirect after OAuth
  // In dev, Vite may run on a different port than configured
  const referer = req.headers.referer || req.headers.origin;
  if (referer) {
    try {
      const url = new URL(referer);
      req.session.frontendOrigin = url.origin;
    } catch {
      // Invalid URL, use default
    }
  }

  const oauth = await getOAuthUrls();
  const params = new URLSearchParams({
    client_id: config.oauthClientId,
    redirect_uri: config.oauthCallbackUrl,
    response_type: 'code',
    scope: 'user:full',
  });

  res.redirect(`${oauth!.authorize}?${params.toString()}`);
});

// GET /auth/callback - Exchange code for token
router.get('/callback', async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;
  // Use stored frontend origin or fall back to config
  const frontendUrl = req.session.frontendOrigin || config.frontendUrl;

  if (error) {
    console.error('OAuth error:', error, error_description);
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(String(error_description || error))}`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.redirect(`${frontendUrl}?error=missing_code`);
    return;
  }

  try {
    const oauth = await getOAuthUrls();

    // Exchange code for token
    const tokenResponse = await axios.post(
      oauth!.token,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.oauthCallbackUrl,
        client_id: config.oauthClientId,
        client_secret: config.oauthClientSecret,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(oauth!.userInfo, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    // Store in session
    req.session.accessToken = access_token;
    req.session.user = {
      name: userResponse.data.metadata?.name || 'unknown',
      uid: userResponse.data.metadata?.uid || '',
    };

    // Redirect to frontend
    res.redirect(frontendUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    const message = err instanceof Error ? err.message : 'Authentication failed';
    res.redirect(`${frontendUrl}?error=${encodeURIComponent(message)}`);
  }
});

// GET /auth/logout - Clear session
router.get('/logout', (req: Request, res: Response) => {
  const frontendUrl = req.session.frontendOrigin || config.frontendUrl;
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect(frontendUrl);
  });
});

// GET /auth/me - Get current user info
router.get('/me', (req: Request, res: Response) => {
  if (!req.session.accessToken || !req.session.user) {
    res.json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    user: req.session.user,
  });
});

export default router;
