/**
 * A plan feature line in pricing UIs: plain string or a titled group with sub-bullets.
 * Stored as JSON in subscription_plans.features (jsonb) and in landing pricing.json.
 */
export interface PlanFeatureGroup {
  title: string;
  subitems: string[];
}

export type PlanFeature = string | PlanFeatureGroup;

export function isPlanFeatureGroup(f: PlanFeature): f is PlanFeatureGroup {
  return (
    typeof f === 'object' &&
    f !== null &&
    'title' in f &&
    'subitems' in f &&
    Array.isArray((f as PlanFeatureGroup).subitems)
  );
}
