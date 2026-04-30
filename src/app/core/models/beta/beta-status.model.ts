export class BetaStatus {
  isBetaUser: boolean;
  status: 'pending' | 'active' | 'expired' | 'not_invited';
  betaAccessUntil: Date | null;
  daysRemaining: number | null;
  foundingRateLocked: boolean;
  postExpiryOffer: { eligible: boolean; priceMonthly: number } | null;

  constructor(data: unknown) {
    const d = data as Record<string, unknown>;
    this.isBetaUser = (d['is_beta_user'] ?? d['isBetaUser'] ?? false) as boolean;
    this.status = (d['status'] ?? 'not_invited') as 'pending' | 'active' | 'expired' | 'not_invited';
    this.foundingRateLocked = (d['founding_rate_locked'] ?? d['foundingRateLocked'] ?? false) as boolean;
    this.daysRemaining = (d['days_remaining'] ?? d['daysRemaining'] ?? null) as number | null;

    const rawUntil = d['beta_access_until'] ?? d['betaAccessUntil'] ?? null;
    this.betaAccessUntil = rawUntil ? new Date(rawUntil as string) : null;

    const rawOffer = d['post_expiry_offer'] ?? d['postExpiryOffer'] ?? null;
    if (rawOffer) {
      const o = rawOffer as Record<string, unknown>;
      this.postExpiryOffer = {
        eligible: true,
        priceMonthly: (o['price_monthly'] ?? o['priceMonthly'] ?? o['monthly_price_usd'] ?? 7.20) as number,
      };
    } else {
      this.postExpiryOffer = null;
    }
  }
}
