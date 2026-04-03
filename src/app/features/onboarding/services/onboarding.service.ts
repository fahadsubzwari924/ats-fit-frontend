import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import { User } from '@core/models/user/user.model';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly http = inject(HttpClient);

  /**
   * Marks the authenticated user's onboarding as completed.
   * Delegates to PATCH /users/onboarding/complete.
   */
  completeOnboarding(): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(
        API_ROUTES.createAPIRoute(API_ROUTES.USER.ONBOARDING_COMPLETE),
        {},
      )
      .pipe(map((response) => new User(response.data)));
  }

  /**
   * Uploads the resume file during onboarding.
   * Reuses the existing POST /users/upload-resume endpoint (no separate
   * onboarding-specific endpoint needed — premium processing is handled
   * server-side based on the user's plan).
   */
  uploadResume(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('resumeFile', file);

    return this.http
      .post<ApiResponse<unknown>>(
        API_ROUTES.createAPIRoute(API_ROUTES.USER.UPLOAD_RESUME),
        formData,
      )
      .pipe(map(() => void 0));
  }
}
