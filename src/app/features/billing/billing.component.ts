import { Component, OnInit, signal } from '@angular/core';
// Enums
import { BillingTab } from './enums/tab.enum';
import { OverviewTabComponent } from "./components/overview-tab/overview-tab.component";
import { PaymentTabComponent } from "./components/payment-tab/payment-tab.component";
import { HistoryTabComponent } from "./components/history-tab/history-tab.component";
import { SubscriptionPlan } from './models/subscription-plan.model';

@Component({
  selector: 'app-billing',
  imports: [OverviewTabComponent, PaymentTabComponent, HistoryTabComponent],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit {

  // Enums
  public BillingTab = BillingTab;

  // Internal States
  public activeTab = signal<string>(BillingTab.OVERVIEW);
  public subscriptionHistory = signal<SubscriptionPlan | null>(null);


  ngOnInit() {
  }

  public setActiveTab(tab: BillingTab) {
    this.activeTab.set(tab);
  }
}
