import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';

const COUNTDOWN_SECONDS = 8;

@Component({
  selector: 'app-onboarding-submitted-screen',
  standalone: true,
  templateUrl: './onboarding-submitted-screen.component.html',
  styleUrls: ['./onboarding-submitted-screen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingSubmittedScreenComponent implements OnInit, OnDestroy {
  @Input() fileName: string | null = null;
  @Input() fileSizeKb: number | null = null;

  @Output() readonly goToDashboard = new EventEmitter<void>();

  readonly countdown = signal(COUNTDOWN_SECONDS);

  private _timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this._timer = setInterval(() => {
      this.countdown.update((c) => {
        if (c <= 1) {
          this.clearTimer();
          this.goToDashboard.emit();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}
