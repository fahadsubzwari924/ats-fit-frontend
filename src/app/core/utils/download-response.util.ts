import { HttpResponse } from '@angular/common/http';

export interface DownloadedResume {
  blob: Blob;
  filename: string;
}

/**
 * Server is the only source of truth for the resume filename. Prefer the
 * CORS-exposed `X-Filename` header (set by the generate and download
 * endpoints); fall back to parsing `Content-Disposition` so this helper still
 * works if the X-* header is ever stripped by a proxy. Falls back to
 * `Resume.pdf` only as a final safety net — surfacing this fallback is itself
 * a bug signal worth investigating server-side.
 */
export function extractDownloadedResume(
  response: HttpResponse<Blob>,
): DownloadedResume {
  const blob = response.body as Blob;
  const xFilename = response.headers.get('x-filename');
  if (xFilename && xFilename.trim()) {
    return { blob, filename: xFilename.trim() };
  }
  const disposition = response.headers.get('content-disposition');
  const parsed = parseContentDispositionFilename(disposition);
  return { blob, filename: parsed || 'Resume.pdf' };
}

function parseContentDispositionFilename(
  disposition: string | null,
): string | null {
  if (!disposition) return null;
  // RFC 5987 filename*=UTF-8''<percent-encoded> takes precedence.
  const utf8Match = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, '')).trim();
    } catch {
      /* fall through to the quoted/unquoted form */
    }
  }
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1]?.trim() ?? null;
}
