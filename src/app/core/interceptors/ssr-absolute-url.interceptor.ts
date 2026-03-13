import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID, InjectionToken } from '@angular/core';
import { isPlatformServer } from '@angular/common';

// Injection token for the server URL
export const SERVER_URL = new InjectionToken<string>('SERVER_URL');

/**
 * Interceptor to convert relative URLs to absolute URLs during SSR
 * This ensures that HTTP requests work correctly when rendering on the server
 */
export const ssrAbsoluteUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Only modify requests when running on the server
  if (isPlatformServer(platformId)) {
    const serverUrl = inject(SERVER_URL, { optional: true }) || '';

    // Check if this is a relative URL (not starting with http:// or https://)
    if (
      serverUrl &&
      req.url &&
      !req.url.startsWith('http://') &&
      !req.url.startsWith('https://')
    ) {
      // Construct absolute URL
      const absoluteUrl = `${serverUrl}${req.url.startsWith('/') ? '' : '/'}${
        req.url
      }`;

      // Clone the request with the absolute URL
      req = req.clone({
        url: absoluteUrl,
      });

      console.log(`[SSR] Converted relative URL to absolute: ${req.url}`);
    }
  }

  return next(req);
};
