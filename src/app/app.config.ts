import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { tokenInterceptorFn } from '@core/interceptors/token.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { quotaInterceptor } from '@core/interceptors/quota.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      })
    ),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([tokenInterceptorFn, authInterceptor, quotaInterceptor])
    ),
  ],
};
