import helmet from 'helmet';
import { randomUUID } from 'crypto';
import { Response, Request, NextFunction } from 'express';

const nonce = (_req: Request, res: Response, next: NextFunction): void => {
  res.locals.cspNonce = Buffer.from(randomUUID()).toString('base64');
  next();
};

const csp = (req: Request, res: Response, next: NextFunction): void => {
  const middleware = helmet({
    contentSecurityPolicy: false,
    noSniff: false,
    originAgentCluster: false,
  });

  return middleware(req, res, next);
};

export { nonce, csp };
