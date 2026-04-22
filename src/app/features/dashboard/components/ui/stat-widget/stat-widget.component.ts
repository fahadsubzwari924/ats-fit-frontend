import { Component, computed, inject, input, signal, OnInit } from '@angular/core';
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
export class StatWidgetComponent implements OnInit {

  private readonly sanitizer = inject(DomSanitizer);

  public featureUsage = input<FeatureUsage>();
  public title = signal<string | null>(null);
  public icon = signal<SafeHtml | null>(null);

  /** Remaining uses this month, falling back to (allowed - used) if the field is absent. */
  readonly remaining = computed(() => {
    const f = this.featureUsage();
    if (!f) return 0;
    if (f.remaining != null) return f.remaining;
    return Math.max(0, (f.allowed ?? 0) - (f.used ?? 0));
  });

  ngOnInit() {
    const feature = this.featureUsage()?.feature;
    if (feature !== undefined && feature in FeatureTitles) {
      this.title.set(FeatureTitles[feature as keyof typeof FeatureTitles]);
      const svgIcon = IconsConstant.SVG_ICONS[feature as keyof typeof IconsConstant.SVG_ICONS];
      this.icon.set(this.sanitizer.bypassSecurityTrustHtml(svgIcon));
    }
  }
}
