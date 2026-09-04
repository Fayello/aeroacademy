import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TrafficTrackerService } from './traffic-tracker.service';

@Injectable()
export class TrafficTrackerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TrafficTrackerMiddleware.name);

  constructor(private tracker: TrafficTrackerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const path = req.route?.path || req.path;

      // Skip static assets and health checks
      if (
        path.startsWith('/_next/') ||
        path.startsWith('/socket.io/') ||
        path === '/health' ||
        path.endsWith('.js') ||
        path.endsWith('.css') ||
        path.endsWith('.ico')
      ) {
        return;
      }

      this.tracker.record({
        ip,
        method: req.method,
        path,
        status: res.statusCode,
        duration,
      });
    });

    next();
  }
}
