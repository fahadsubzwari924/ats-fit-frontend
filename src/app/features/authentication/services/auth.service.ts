import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import { ApiResponse } from '@core/models/response/api-response.model';
import { User } from '@core/models/user/user.model';
import { LoginResponse } from '@features/authentication/models/login-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _http = inject(HttpClient);

  public login(payload: any): Observable<LoginResponse> {
    return this._http.post<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.SIGNIN), payload)
    .pipe(
      map(response => new LoginResponse(response.data)),
    );
  }

  public signup(user: any): Observable<ApiResponse<User>> {
    return this._http.post<ApiResponse<User>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.SIGNUP), user);
  }

  public googleAuth(payload: any): Observable<LoginResponse> {
    return this._http.post<ApiResponse<any>>(API_ROUTES.createAPIRoute(API_ROUTES.AUTH.GOOGLE_LOGIN), payload)
    .pipe(
      map(response => new LoginResponse(response.data)),
    );
  }

}
