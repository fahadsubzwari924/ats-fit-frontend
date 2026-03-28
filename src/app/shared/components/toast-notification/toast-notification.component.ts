import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import type { AppToastData } from './toast-notification.types';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.scss',
})
export class ToastNotificationComponent {
  protected readonly snackBarRef = inject(
    MatSnackBarRef<ToastNotificationComponent>,
  );
  protected readonly data = inject<AppToastData>(MAT_SNACK_BAR_DATA);

  /** Outline icons only — no filled badges (calmer, more “system UI”). */
  protected iconName(): string {
    switch (this.data.variant) {
      case 'success':
        return 'check_circle_outline';
      case 'error':
        return 'error_outline';
      case 'warning':
        return 'warning_amber';
      case 'info':
        return 'info_outline';
      default:
        return 'notifications';
    }
  }

  protected onAction(): void {
    this.snackBarRef.dismissWithAction();
  }
}
