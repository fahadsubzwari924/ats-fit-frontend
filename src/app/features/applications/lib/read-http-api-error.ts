import { isQuotaExceededError } from '@core/errors/quota-exceeded.error';

/**
 * Best-effort message extraction from Angular HttpClient / Nest error bodies.
 *
 * Special-case: returns `undefined` for QuotaExceededError so existing
 * `showError(readHttpApiError(err) ?? 'fallback')` patterns become silent
 * no-ops on quota exhaustion. The QuotaInterceptor surfaces the UI
 * separately through QuotaState.
 */
export function readHttpApiError(err: unknown): string | undefined {
  if (isQuotaExceededError(err)) {
    return undefined;
  }
  if (!err || typeof err !== 'object' || !('error' in err)) {
    return undefined;
  }
  const e = err as { error?: { message?: string }; message?: string };
  return e.error?.message ?? e.message;
}
