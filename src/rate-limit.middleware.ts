import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private defaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (req: Request, res: Response) => {
      res
        .status(429)
        .json({ message: 'Too many requests. Please try again later.' });
    },
  });

  private authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    handler: (req: Request, res: Response) => {
      res
        .status(429)
        .json({ message: 'Too many login attempts. Please try again later.' });
    },
  });

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.path.startsWith('/auth')) {
      this.authLimiter(req, res, next);
    } else {
      this.defaultLimiter(req, res, next);
    }
  }
}
