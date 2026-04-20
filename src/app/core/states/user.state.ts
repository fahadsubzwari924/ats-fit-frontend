import { Platform } from '@angular/cdk/platform';
import { computed, inject, Injectable, signal } from '@angular/core';
import { UploadedResume } from '@core/models/user/uploaded-resumes.model';
import { User } from '@core/models/user/user.model';
import { StorageService } from '@shared/services/storage.service';
import { UserApiService } from '@shared/services/user-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserState {

  // Injection
  private storageService = inject(StorageService);
  private userApiService = inject(UserApiService);

  private platform = new Platform();

  // Signals
  private _currentUser = signal<User | null>(null);
  private _isLoggedIn = signal<boolean>(false);

  // Public readonly signals
  public readonly currentUser = this._currentUser.asReadonly();
  public readonly isLoggedIn = this._isLoggedIn.asReadonly();
  public readonly uploadedResumes = computed(() => this._currentUser()?.uploadedResumes || []);
  public readonly featureUsage = computed(() => this._currentUser()?.featureUsage);
  public readonly isPremiumUser = computed(() => this._currentUser()?.isPremium ?? false);
  public readonly onboardingCompleted = computed(
    () => this._currentUser()?.onboardingCompleted ?? true
  );

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

  public markOnboardingComplete(): void {
    const current = this._currentUser();
    if (!current) return;

    const updated = new User({
      ...current,
      onboardingCompleted: true
    });

    this._currentUser.set(updated);
    this.saveToStorage();
  }

  public updateUserResume(resume: UploadedResume): void {
    this._currentUser.update(user => {
      if (!user) return user;
      return new User({ ...user, uploadedResumes: [...(user.uploadedResumes ?? []), resume] });
    });
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
    if (!this.platform.isBrowser) {
      return;
    }
    const current = this._currentUser();
    this.storageService.setUser(current);
  }

  private loadFromStorage(): void {
    if (!this.platform.isBrowser) {
      return;
    }
    const user = this.storageService.getUser();
    if (user) {
      this._currentUser.set(user);
      this._isLoggedIn.set(true);
      this.refreshFromApi();
    }
  }

  private refreshFromApi(): void {
    this.userApiService.getCurrentUser().subscribe({
      next: (user) => {
        this._currentUser.set(user);
        this.saveToStorage();
      },
      error: () => {
        // Silently keep stale localStorage data if API fails
      },
    });
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
