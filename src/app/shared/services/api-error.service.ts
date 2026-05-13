import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

/**
 * Single field-level validation error returned by the backend.
 * Matches the shape produced by AllExceptionsFilter.formatValidationErrors
 * in ats-fit-backend.
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Normalized, UI-ready error parsed from any backend response.
 * Components bind `message` to their inline alert and may iterate
 * `fieldErrors` to highlight individual form controls.
 */
export interface ParsedApiError {
  message: string;
  fieldErrors: ApiFieldError[];
}

/**
 * Options for tailoring parsing to a specific feature.
 *
 * - `codeMap` lets a feature map backend error codes (e.g. `BETA_CODE_EXPIRED`,
 *   `ERR_BAD_REQUEST`) to friendly UI copy without leaking codes into the UI.
 * - `defaultMessage` is the last-resort copy when nothing else can be extracted.
 */
export interface ParseOptions {
  codeMap?: Readonly<Record<string, string>>;
  defaultMessage?: string;
}

const GENERIC_BACKEND_MESSAGES: ReadonlySet<string> = new Set([
  'Validation failed',
  'Internal server error',
  'Bad Request',
  'Not Found',
  'Conflict',
  'Forbidden',
  'Unauthorized',
]);

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_FAILURE_MESSAGE =
  'We could not reach the server. Please check your connection and try again.';

/**
 * Centralized parser for the backend's standard error envelope:
 *
 *   { status: 'error', message: string, code: string,
 *     errors: ApiFieldError[] | null, ... }
 *
 * Single responsibility: turn an unknown error value into a human-readable
 * `{ message, fieldErrors }`. All consumers (signup, signin, beta-redeem, …)
 * route through here so error UX stays consistent.
 *
 * Resolution order:
 *   1. Network/transport failure → friendly offline copy
 *   2. Explicit `codeMap` hit on `code` or `message`
 *   3. First entry from `errors[]` (field-level validation message)
 *   4. Backend `message` if it is human-readable (not a generic placeholder)
 *   5. `defaultMessage` or a hard-coded fallback
 */
@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  public parse(error: unknown, options: ParseOptions = {}): ParsedApiError {
    const defaultMessage = options.defaultMessage ?? FALLBACK_MESSAGE;
    const codeMap = options.codeMap ?? {};

    if (this.isNetworkFailure(error)) {
      return { message: NETWORK_FAILURE_MESSAGE, fieldErrors: [] };
    }

    const body = this.extractBody(error);
    const fieldErrors = this.extractFieldErrors(body);

    const mappedFromCode = this.lookupCode(body, codeMap);
    if (mappedFromCode) {
      return { message: mappedFromCode, fieldErrors };
    }

    if (fieldErrors.length > 0) {
      return { message: fieldErrors[0].message, fieldErrors };
    }

    const rawMessage = body?.message;
    if (this.isMeaningfulMessage(rawMessage)) {
      return { message: rawMessage, fieldErrors };
    }

    return { message: defaultMessage, fieldErrors };
  }

  private isNetworkFailure(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      (error.status === 0 || error.status === HttpStatusCode.GatewayTimeout)
    );
  }

  private extractBody(error: unknown): {
    message?: string;
    code?: string | number;
    errors?: unknown;
  } | null {
    if (!(error instanceof HttpErrorResponse)) {
      return null;
    }
    const raw = error.error;
    if (raw && typeof raw === 'object') {
      return raw as { message?: string; code?: string | number; errors?: unknown };
    }
    return null;
  }

  private extractFieldErrors(
    body: { errors?: unknown } | null,
  ): ApiFieldError[] {
    const list = body?.errors;
    if (!Array.isArray(list)) {
      return [];
    }
    return list.filter(
      (entry): entry is ApiFieldError =>
        !!entry &&
        typeof entry === 'object' &&
        'message' in entry &&
        typeof (entry as { message: unknown }).message === 'string',
    );
  }

  private lookupCode(
    body: { message?: string; code?: string | number } | null,
    codeMap: Readonly<Record<string, string>>,
  ): string | null {
    if (!body) {
      return null;
    }
    const codeCandidate =
      typeof body.code === 'string' ? body.code : undefined;
    if (codeCandidate && codeMap[codeCandidate]) {
      return codeMap[codeCandidate];
    }
    // Many backend paths surface the error code in the `message` field
    // (e.g. NestJS standard exceptions thrown with a code string).
    const messageCandidate =
      typeof body.message === 'string' ? body.message : undefined;
    if (messageCandidate && codeMap[messageCandidate]) {
      return codeMap[messageCandidate];
    }
    return null;
  }

  private isMeaningfulMessage(message: unknown): message is string {
    return (
      typeof message === 'string' &&
      message.trim().length > 0 &&
      !GENERIC_BACKEND_MESSAGES.has(message)
    );
  }
}
