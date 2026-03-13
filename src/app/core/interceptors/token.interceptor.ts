import { Platform } from '@angular/cdk/platform';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_ROUTES } from '@core/constants/api.constant';
import { StorageService } from '@shared/services/storage.service';

const EXCLUDED_URLS = [
  API_ROUTES.AUTH.SIGNIN,
  API_ROUTES.AUTH.SIGNUP
];

export const tokenInterceptorFn: HttpInterceptorFn = (req, next) => {
  const platform = new Platform();
  const storageService = new StorageService();
  if (EXCLUDED_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }
  const token = platform.isBrowser ? storageService.getToken() : null;
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};
