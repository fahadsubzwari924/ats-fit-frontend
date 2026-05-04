import {
  ChangeDetectorRef,
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { FeatureType } from '@core/enums/feature-type.enum';
import { QuotaState } from '@core/states/quota.state';
import { QuotaReachedCardComponent } from '@shared/components/quota-reached-card/quota-reached-card.component';

@Directive({
  selector: '[appQuotaGate]',
  standalone: true,
})
export class QuotaGateDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly quotaState = inject(QuotaState);

  readonly appQuotaGate = input.required<FeatureType>();

  private renderedState: 'default' | 'card' | 'none' = 'none';

  constructor() {
    effect(() => {
      const feature = this.appQuotaGate();
      const quota = this.quotaState.quotaFor(feature)();
      const exhausted = quota?.status === 'exhausted';

      if (exhausted && this.renderedState !== 'card') {
        this.vcr.clear();
        const ref = this.vcr.createComponent(QuotaReachedCardComponent);
        ref.setInput('feature', feature);
        this.renderedState = 'card';
        this.cdr.markForCheck();
        return;
      }

      if (!exhausted && this.renderedState !== 'default') {
        this.vcr.clear();
        this.vcr.createEmbeddedView(this.tpl);
        this.renderedState = 'default';
        this.cdr.markForCheck();
      }
    });
  }
}
