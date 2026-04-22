import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { SubscriptionPlan } from '@features/billing/models/subscription-plan.model';
import { isPlanFeatureGroup } from '@shared/types/plan-feature.type';

@Component({
  selector: 'app-plan-card',
  imports: [NgClass],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss'
})
export class PlanCardComponent {
  readonly isPlanFeatureGroup = isPlanFeatureGroup;

  // Inputs
  plan = input<SubscriptionPlan>({} as SubscriptionPlan);
  selected = input<boolean>(false);

  // Outputs
  planSelected = output<SubscriptionPlan>();

  handlePlanButtonClick(plan: SubscriptionPlan) {
    if (!this.selected()) {
      this.planSelected.emit(plan);
    }
  }

}
