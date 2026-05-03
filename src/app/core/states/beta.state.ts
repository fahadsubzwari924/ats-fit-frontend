import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BetaStatus } from '@core/models/beta/beta-status.model';
import { BetaApiService } from '@shared/services/beta-api.service';

@Injectable({ providedIn: 'root' })
export class BetaState {
  private _betaApiService = inject(BetaApiService);

  private _betaStatus = signal<BetaStatus | null>(null);
  private _loaded = signal(false);

  public readonly betaStatus = this._betaStatus.asReadonly();
  public readonly loaded = this._loaded.asReadonly();
  public readonly isBetaUser = computed(() => this._betaStatus()?.isBetaUser ?? false);
  public readonly isActiveBeta = computed(() => this._betaStatus()?.status === 'active');
  public readonly isPendingRedemption = computed(() => this._betaStatus()?.status === 'pending');
  public readonly isExpiredBeta = computed(() => this._betaStatus()?.status === 'expired');
  public readonly daysRemaining = computed(() => this._betaStatus()?.daysRemaining ?? null);
  public readonly hasPostExpiryOffer = computed(() => this._betaStatus()?.postExpiryOffer?.eligible ?? false);

  public loadStatus(): Observable<BetaStatus> {
    const obs$ = this._betaApiService.getStatus().pipe(
      tap({
        next: (status) => {
          this._betaStatus.set(status);
          this._loaded.set(true);
        },
        error: () => {
          this._loaded.set(true);
        },
      }),
    );
    obs$.subscribe();
    return obs$;
  }

  public setStatus(status: BetaStatus): void {
    this._betaStatus.set(status);
  }

  public clearStatus(): void {
    this._betaStatus.set(null);
    this._loaded.set(false);
  }
}
