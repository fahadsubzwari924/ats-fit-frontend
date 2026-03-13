import { Component, inject, OnInit, signal } from '@angular/core';
import { PricingPlan } from '@features/billing/interfaces/pricing-plan.interface';
import { CurrentUsageCardComponent } from "@features/billing/components/current-usage-card/current-usage-card.component";
import { PlanCardComponent } from "@features/billing/components/plan-card/plan-card.component";
import { BillingService } from '@features/billing/services/billing.service';
import { SubscriptionPlan } from '@features/billing/models/subscription-plan.model';
import { UserState } from '@core/states/user.state';
import { ResumeService } from '@shared/services/resume.service';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-overview-tab',
  imports: [CurrentUsageCardComponent, PlanCardComponent],
  templateUrl: './overview-tab.component.html',
  styleUrl: './overview-tab.component.scss'
})
export class OverviewTabComponent implements OnInit {

  // Dependency Injection
  private billingService = inject(BillingService);
  private resumeService = inject(ResumeService);

  // States
  private userState = inject(UserState);

  // Internal State
  public subscriptionPlan = signal<SubscriptionPlan[]>([]);
  public userSubscribedPlan = signal<SubscriptionPlan | null>(null);
  public featureUsage = signal<FeatureUsage[]>([]);

  // billingInfo: BillingInfo = {
  //   currentPlan: 'Premium',
  //   nextBilling: 'Mar 15, 2024',
  //   amount: '$19.00'
  // };

  ngOnInit(): void {
    this.initializeContent();
  }

  private initializeContent(): void {
    forkJoin([
      this.billingService.getSubscriptionPlans(),
      this.resumeService.getFeatureUsage()
    ]).subscribe(([plans, feature]) => {
      this.subscriptionPlan.set(plans?.length ? plans : []);
      this.featureUsage.set(feature?.length ? feature : []);
    });
  }

  /**
   * Calculate progress percentage for usage items
   * @param current Current usage value
   * @param max Maximum allowed value
   * @returns Progress percentage
   */
  calculateProgressPercentage(current: number, max: number): number {
    return Math.round((current / max) * 100 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Handle pricing plan button clicks
   * @param plan The pricing plan that was clicked
   */
  onPlanButtonClick(plan: SubscriptionPlan): void {
    if (plan) {
      this.billingService.checkout(this.createCheckoutPayload(plan?.id))
      .subscribe({
        next: (response) => {
          if (response?.status && response?.data?.checkoutUrl) {
            window.location.href = response.data.checkoutUrl as string;
          }
        },
        error: (error) => {
          console.error('Error during checkout:', error);
        }
      });
    }
  }

  private createCheckoutPayload(plainId: string) {
    return {
      plan_id: plainId,
      metadata: {
        email: this.userState.currentUser()?.email
      }
      // Include any other necessary information for the checkout process
    };
  }

  /**
   * Check if a plan is disabled (current plan)
   * @param plan The pricing plan to check
   * @returns boolean indicating if the plan button should be disabled
   */
  isPlanDisabled(plan: PricingPlan): boolean {
    return plan.isCurrentPlan && plan.buttonText === 'Current Plan';
  }

}
