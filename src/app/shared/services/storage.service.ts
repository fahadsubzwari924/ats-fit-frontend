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

  public setUser(user: User): void {
    if (this.platform.isBrowser) {
      localStorage.setItem(StorageKeys.USER, JSON.stringify(user));
    }
  }

  public getUser(): User | null {
    if (this.platform.isBrowser) {
      const user = localStorage.getItem(StorageKeys.USER);
      return user ? new User(JSON.parse(user)) : null;
    }
    return null;
  }

  public clear(): void {
    if (this.platform.isBrowser) {
      localStorage.clear();
      sessionStorage.clear();
    }
  }

}
