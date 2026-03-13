import { Component, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FeatureTitles } from '@features/dashboard/constants/feature-title.constant';
import { IconsConstant } from '@core/constants/icons.contant';
import { FeatureUsage } from '@core/models/user/feature-usage.model';

@Component({
  selector: 'app-stat-widget',
  standalone: true,
  imports: [],
  templateUrl: './stat-widget.component.html',
  styleUrl: './stat-widget.component.scss'
})
export class StatWidgetComponent {

  public featureUsage = input<FeatureUsage>();
  public title = signal<string | null>(null);
  public icon = signal<SafeHtml | null>(null);

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    const feature = this.featureUsage()?.feature;
    if (feature !== undefined && feature in FeatureTitles) {
      this.title.set(FeatureTitles[feature as keyof typeof FeatureTitles]);
      const svgIcon = IconsConstant.SVG_ICONS[feature as keyof typeof IconsConstant.SVG_ICONS];
      this.icon.set(this.sanitizer.bypassSecurityTrustHtml(svgIcon));
    }
  }
}
