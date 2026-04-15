import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

/** Use in TestBed `providers` when a component tree injects `HttpClient`. */
export const httpClientTestProviders = [provideHttpClient(), provideHttpClientTesting()] as const;
