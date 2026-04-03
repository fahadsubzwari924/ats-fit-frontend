import { Platform } from '@angular/cdk/platform';
import { Injectable } from '@angular/core';
import { StorageKeys } from '@core/enums/storage-keys.enum';
import { User } from '@core/models/user/user.model';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  private platform = new Platform();

  public setToken(token: string): void {
    if (this.platform.isBrowser) {
      localStorage.setItem(StorageKeys.TOKEN, token)
    }
  }

  public getToken(): string | null {
    if (this.platform.isBrowser) {
      return localStorage.getItem(StorageKeys.TOKEN);
    }
    return null;
  }

  public removeToken(): void {
    if (this.platform.isBrowser) {
      localStorage.removeItem(StorageKeys.TOKEN);
    }
  }

  public setUser(user: User | null): void {
    if (!this.platform.isBrowser) {
      return;
    }
    if (user == null) {
      localStorage.removeItem(StorageKeys.USER);
      return;
    }
    localStorage.setItem(StorageKeys.USER, JSON.stringify(user));
  }

  public getUser(): User | null {
    if (!this.platform.isBrowser) {
      return null;
    }
    const raw = localStorage.getItem(StorageKeys.USER);
    if (raw == null || raw === '') {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed == null || typeof parsed !== 'object') {
        return null;
      }
      return new User(parsed);
    } catch {
      localStorage.removeItem(StorageKeys.USER);
      return null;
    }
  }

  public clear(): void {
    if (this.platform.isBrowser) {
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  public setItem(key: string, value: string): void {
    if (this.platform.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  public getItem(key: string): string | null {
    if (this.platform.isBrowser) {
      return localStorage.getItem(key);
    }
    return null;
  }

  public removeItem(key: string): void {
    if (this.platform.isBrowser) {
      localStorage.removeItem(key);
    }
  }

}
