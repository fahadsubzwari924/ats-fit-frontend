import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { UserState } from './user.state';
import { BetaState } from './beta.state';
import { FeatureType } from '@core/enums/feature-type.enum';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { classifyQuotaStatus, FeatureQuotaState, FeatureQuotaStatus } from '@core/models/quota/feature-quota-state.model';
import { BETA_EXPIRING_SOON_THRESHOLD_DAYS, UserTier } from '@core/models/quota/user-tier.type';

const MS_PER_DAY = 86_400_000;

@Injectable({ providedIn: 'root' })
export class QuotaState {
  private readonly userState = inject(UserState);
  private readonly betaState = inject(BetaState);

  private readonly overrides = signal<Map<FeatureType, FeatureQuotaState>>(new Map());

  readonly betaDaysRemaining: Signal<number | null> = computed(() => {
    const status = this.betaState.betaStatus();
    if (!status?.isBetaUser || !status.betaAccessUntil) return null;
    const ms = status.betaAccessUntil.getTime() - Date.now();
    if (ms <= 0) return null;
    return Math.ceil(ms / MS_PER_DAY);
  });

  readonly userTier: Signal<UserTier> = computed(() => {
    const days = this.betaDaysRemaining();
    if (days !== null) {
      return days > BETA_EXPIRING_SOON_THRESHOLD_DAYS ? 'beta_active' : 'beta_expiring_soon';
    }
    return this.userState.isPremiumUser() ? 'premium_paid' : 'freemium';
  });

  quotaFor(feature: FeatureType): Signal<FeatureQuotaState | null> {
    return computed(() => {
      const override = this.overrides().get(feature);
      if (override) return override;

      const usage = this.userState.featureUsage();
      if (!usage) return null;

      const entry = usage.find((u) => u.feature === feature);
      if (!entry) return null;

      return this.fromFeatureUsage(feature, entry);
    });
  }

  /**
   * Returns a signal of the most-severe status across the given features.
   * Severity order: 'exhausted' > 'approaching' > 'healthy'.
   * Returns 'healthy' when no feature has data yet.
   */
  worstStatusAcross(features: FeatureType[]): Signal<FeatureQuotaStatus> {
    return computed(() => {
      let worst: FeatureQuotaStatus = 'healthy';
      for (const f of features) {
        const q = this.quotaFor(f)();
        if (!q) continue;
        if (q.status === 'exhausted') return 'exhausted';
        if (q.status === 'approaching') worst = 'approaching';
      }
      return worst;
    });
  }

  /**
   * Returns the first exhausted feature among the inputs (used by banner to pick
   * which feature's copy to show). Returns null if none exhausted.
   */
  firstExhausted(features: FeatureType[]): Signal<FeatureType | null> {
    return computed(() => {
      for (const f of features) {
        if (this.quotaFor(f)()?.status === 'exhausted') return f;
      }
      return null;
    });
  }

  /**
   * Returns the first approaching feature among the inputs (banner fallback when
   * nothing is exhausted but at least one is ≥80%).
   */
  firstApproaching(features: FeatureType[]): Signal<FeatureType | null> {
    return computed(() => {
      for (const f of features) {
        if (this.quotaFor(f)()?.status === 'approaching') return f;
      }
      return null;
    });
  }

  markFeatureExhausted(feature: FeatureType, used: number, allowed: number, resetDate: Date): void {
    const next = new Map(this.overrides());
    next.set(feature, {
      feature,
      used,
      allowed,
      remaining: 0,
      percentage: 100,
      resetDate,
      daysToReset: this.daysUntil(resetDate),
      status: 'exhausted',
    });
    this.overrides.set(next);
  }

  clearOverride(feature: FeatureType): void {
    if (!this.overrides().has(feature)) return;
    const next = new Map(this.overrides());
    next.delete(feature);
    this.overrides.set(next);
  }

  /**
   * Called by feature components after a successful AI action consumes a quota
   * credit. Optimistically decrements local usage so the UI updates instantly,
   * then triggers a silent server refresh to reconcile any drift, clearing the
   * optimistic override once authoritative data lands.
   */
  notifyFeatureConsumed(feature: FeatureType): void {
    const current = this.quotaFor(feature)();
    if (current) {
      const nextUsed = current.used + 1;
      const nextRemaining = Math.max(0, current.remaining - 1);
      const nextPercentage = current.allowed === 0
        ? 100
        : Math.min(100, Math.round((nextUsed / current.allowed) * 100));
      const next = new Map(this.overrides());
      next.set(feature, {
        ...current,
        used: nextUsed,
        remaining: nextRemaining,
        percentage: nextPercentage,
        status: classifyQuotaStatus(nextRemaining, nextPercentage),
      });
      this.overrides.set(next);
    }

    this.userState.refreshCurrentUser().subscribe({
      next: () => this.clearOverride(feature),
      error: () => {
        // Keep optimistic override in place — server unreachable.
      },
    });
  }

  private fromFeatureUsage(feature: FeatureType, u: FeatureUsage): FeatureQuotaState {
    const allowed = u.allowed ?? 0;
    const used = u.used ?? 0;
    const remaining = u.remaining ?? Math.max(0, allowed - used);
    const percentage = allowed === 0 ? 100 : Math.min(100, Math.round((used / allowed) * 100));
    const resetDate = new Date(u.resetDate);
    return {
      feature,
      used,
      allowed,
      remaining,
      percentage,
      resetDate,
      daysToReset: u.daysRemaining ?? this.daysUntil(resetDate),
      status: classifyQuotaStatus(remaining, percentage),
    };
  }

  private daysUntil(d: Date): number {
    const ms = d.getTime() - Date.now();
    return ms <= 0 ? 0 : Math.ceil(ms / MS_PER_DAY);
  }
}
