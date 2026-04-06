/** Best-effort message from Angular HttpClient / Nest error bodies. */
export function readHttpApiError(err: unknown): string | undefined {
  if (!err || typeof err !== 'object' || !('error' in err)) {
    return undefined;
  }
  const e = err as { error?: { message?: string }; message?: string };
  return e.error?.message ?? e.message;
}
