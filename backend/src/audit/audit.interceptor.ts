import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AUDIT_ACTION_METADATA } from '../common/audit.decorator';

export interface RequestWithUser extends Request {
  user?: { id: string; email?: string; role?: string };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const methodAction = Reflect.getMetadata(
      AUDIT_ACTION_METADATA,
      context.getHandler(),
    ) as string | undefined;
    const classAction = Reflect.getMetadata(
      AUDIT_ACTION_METADATA,
      context.getClass(),
    ) as string | undefined;
    const action = methodAction || classAction;

    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.auditService
          .log({ action, request, duration: Date.now() - startedAt })
          .catch(() => {});
      }),
      catchError((err: unknown) => {
        this.auditService
          .log({
            action,
            request,
            error: err,
            duration: Date.now() - startedAt,
          })
          .catch(() => {});
        return throwError(() => err);
      }),
    );
  }
}
