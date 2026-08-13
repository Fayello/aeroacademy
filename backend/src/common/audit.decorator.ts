import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_METADATA = 'audit:action';

/**
 * Marks an endpoint for audit logging. Works at method or class level.
 * The AuditInterceptor (registered globally) writes an AuditLog row after
 * the handler completes (or fails), with sanitized request metadata.
 *
 * @example @Audit('AUTH_LOGIN')
 * @example @Audit('COURSE_CREATED')
 */
export const Audit = (action: string) =>
  SetMetadata(AUDIT_ACTION_METADATA, action);
