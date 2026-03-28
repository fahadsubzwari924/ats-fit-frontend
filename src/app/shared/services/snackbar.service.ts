import { Injectable, inject } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { SnackbarConfig } from '@shared/interfaces/snakbar-config.interface';
import { ToastNotificationComponent } from '../components/toast-notification/toast-notification.component';
import type { ToastVariant } from '../components/toast-notification/toast-notification.types';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  private normalizePanelClass(panelClass?: string | string[]): string[] {
    if (!panelClass) {
      return [];
    }
    return Array.isArray(panelClass) ? panelClass : [panelClass];
  }

  /**
   * Custom toast UI: icon, soft surface, dismiss control.
   * Text "Close" from legacy callers is omitted in favor of the dismiss icon.
   */
  private openStyledToast(
    message: string,
    variant: ToastVariant,
    config?: SnackbarConfig,
    fallbackDuration?: number,
  ): MatSnackBarRef<ToastNotificationComponent> {
    const duration =
      config?.duration ?? fallbackDuration ?? this.defaultConfig.duration;
    const actionLabel =
      config?.action && config.action !== 'Close' ? config.action : undefined;

    return this.snackBar.openFromComponent(ToastNotificationComponent, {
      horizontalPosition:
        config?.horizontalPosition ?? this.defaultConfig.horizontalPosition,
      verticalPosition:
        config?.verticalPosition ?? this.defaultConfig.verticalPosition,
      duration,
      data: { message, variant, actionLabel },
      panelClass: [
        'app-toast-panel',
        `${variant}-toast-panel`,
        ...this.normalizePanelClass(config?.panelClass),
      ],
    });
  }

  public showSuccess(
    message: string,
    config?: SnackbarConfig,
  ): MatSnackBarRef<ToastNotificationComponent> {
    return this.openStyledToast(message, 'success', config, 4000);
  }

  public showError(
    message: string,
    config?: SnackbarConfig,
  ): MatSnackBarRef<ToastNotificationComponent> {
    return this.openStyledToast(message, 'error', config, 6000);
  }

  public showWarning(
    message: string,
    config?: SnackbarConfig,
  ): MatSnackBarRef<ToastNotificationComponent> {
    return this.openStyledToast(message, 'warning', config, 5000);
  }

  public showInfo(
    message: string,
    config?: SnackbarConfig,
  ): MatSnackBarRef<ToastNotificationComponent> {
    return this.openStyledToast(message, 'info', config, 4000);
  }

  /**
   * Generic toast using the neutral "info" style (legacy / ad-hoc).
   */
  public show(
    message: string,
    action?: string,
    config?: SnackbarConfig,
  ): MatSnackBarRef<ToastNotificationComponent> {
    const textAction =
      (action && action !== 'Close' ? action : undefined) ||
      (config?.action && config.action !== 'Close' ? config.action : undefined);
    return this.openStyledToast(message, 'info', {
      ...config,
      action: textAction,
    });
  }

  public dismiss(): void {
    this.snackBar.dismiss();
  }
}
