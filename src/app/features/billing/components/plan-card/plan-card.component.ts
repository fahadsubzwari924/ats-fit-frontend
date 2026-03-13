import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { SubscriptionPlan } from '@features/billing/models/subscription-plan.model';

@Component({
  selector: 'app-plan-card',
  imports: [NgClass],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss'
})
export class PlanCardComponent {

  // Inputs
  plan = input<SubscriptionPlan>({} as SubscriptionPlan);
  selected = input<boolean>(false);

  // Outputs
  onPlanSelect = output<SubscriptionPlan>();

  ngOnInit() {
  }

  handlePlanButtonClick(plan: SubscriptionPlan) {
    if (!this.selected()) {
      this.onPlanSelect.emit(plan);
    }
  }

}
