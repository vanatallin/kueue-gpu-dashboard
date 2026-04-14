import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    user?: {
      name: string;
      uid: string;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.accessToken) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  next();
}

export function getToken(req: Request): string | undefined {
  return req.session.accessToken;
}
