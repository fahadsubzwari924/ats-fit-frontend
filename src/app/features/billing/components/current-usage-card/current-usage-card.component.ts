import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { FeatureUsage } from '@core/models/user/feature-usage.model';
import { FeatureTitles } from '@features/dashboard/constants/feature-title.constant';

@Component({
  selector: 'app-current-usage-card',
  imports: [NgClass],
  templateUrl: './current-usage-card.component.html',
  styleUrl: './current-usage-card.component.scss'
})
export class CurrentUsageCardComponent {

  public usage = input<FeatureUsage>();

  public featureTitles = FeatureTitles;

  public getCardIconGradient(feature: string | undefined): string {
    switch (feature) {
      case 'resume_generation':
        return 'from-emerald-50 to-teal-50 border-emerald-200';
      default:
        return 'from-emerald-50 to-teal-50 border-emerald-200';
    }
  }

  public getTitleColorClass(feature: string | undefined): string {
    switch (feature) {
      case 'resume_generation':
        return 'text-emerald-700';
      default:
        return 'text-emerald-700';
    }
  }

  public getValueColorClass(feature: string | undefined): string {
    switch (feature) {
      case 'resume_generation':
        return 'text-emerald-900';
      default:
        return 'text-emerald-900';
    }
  }

  getTitle(): string {
    const feature = this.usage()?.feature;
    if (feature !== undefined && feature in FeatureTitles) {
      return FeatureTitles[feature as keyof typeof FeatureTitles];
    }
    return '';
  }

}
