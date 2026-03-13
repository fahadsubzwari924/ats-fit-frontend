import { Platform } from '@angular/cdk/platform';
import { computed, inject, Injectable, signal } from '@angular/core';
import { SubscriptionType } from '@core/enums/subscription-type.enum';
import { UploadedResume } from '@core/models/user/uploaded-resumes.model';
import { User } from '@core/models/user/user.model';
import { StorageService } from '@shared/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserState {

  // Injection
  private storageService = inject(StorageService);

  private platform = new Platform();

  // Signals
  private _currentUser = signal<User | null>(null);
  private _isLoggedIn = signal<boolean>(false);

  // Public readonly signals
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isLoggedIn = this._isLoggedIn.asReadonly();
  public readonly uploadedResumes = computed(() => this._currentUser()?.uploadedResumes || []);
  public readonly featureUsage = computed(() => this._currentUser()?.featureUsage);
  public readonly isPremiumUser = computed(() => this._currentUser()?.plan === SubscriptionType.PREMIUM)

  constructor() {
    this.loadFromStorage();
  }

  // Methods
  public setUser(user: User): void {
    this._currentUser.set(user);
    this._isLoggedIn.set(true);
    this.saveToStorage();
  }

  public logout(): void {
    this._currentUser.set(null);
    this._isLoggedIn.set(false);
    this.saveToStorage();
  }

  public updateUser(user: User): User | null {
    if (!this._currentUser()) return null;

    this._currentUser.set(user);
    this.saveToStorage();
    return user;
  }

  public updateUserResume(resume: UploadedResume): void {
    this._currentUser()?.uploadedResumes.push(resume);
    this.saveToStorage();
  }

  public deleteUploadedResume(resumeId: string): void {
    const currentUser = this._currentUser();
    if (!currentUser?.uploadedResumes) return;

    this._currentUser.update(user => (user?.uploadedResumes?.length) ? { ...user, uploadedResumes: user?.uploadedResumes?.filter(resume => resume.id !== resumeId) } : user);

    // Save the updated state to storage
    this.saveToStorage();
  }

  // Storage methods
  private saveToStorage(): void {
    this.platform.isBrowser && this.storageService.setUser(this._currentUser() as User);
  }

  private loadFromStorage(): void {
    if (!this.platform.isBrowser) {
      return;
    }
    const user = this.storageService.getUser();
    if (user) {
      this._currentUser.set(user);
      this._isLoggedIn.set(true);
    }
  }

  // Utility methods
  public resetState(): void {
    if (!this.platform.isBrowser) {
      return;
    }
    this._currentUser.set(null);
    this._isLoggedIn.set(false);
  }
}
