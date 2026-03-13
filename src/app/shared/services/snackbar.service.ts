import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { SnackbarConfig } from '@shared/interfaces/snakbar-config.interface';


@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
  };

  /**
   * Show a success snackbar
   * @param message - The message to display
   * @param config - Optional configuration
   */
  public showSuccess(message: string, config?: SnackbarConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackbarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['success-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || 'Close', snackbarConfig);
  }

  /**
   * Show an error snackbar
   * @param message - The message to display
   * @param config - Optional configuration
   */
  public showError(message: string, config?: SnackbarConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackbarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config?.duration || 6000, // Error messages should stay longer
      ...config,
      panelClass: ['error-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || 'Close', snackbarConfig);
  }

  /**
   * Show a warning snackbar
   * @param message - The message to display
   * @param config - Optional configuration
   */
  public showWarning(message: string, config?: SnackbarConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackbarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['warning-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || 'Close', snackbarConfig);
  }

  /**
   * Show an info snackbar
   * @param message - The message to display
   * @param config - Optional configuration
   */
  public showInfo(message: string, config?: SnackbarConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackbarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: ['info-snackbar', ...(config?.panelClass || [])]
    };

    return this.snackBar.open(message, config?.action || 'Close', snackbarConfig);
  }

  /**
   * Show a custom snackbar
   * @param message - The message to display
   * @param action - Optional action button text
   * @param config - Optional configuration
   */
  public show(message: string, action?: string, config?: SnackbarConfig): MatSnackBarRef<SimpleSnackBar> {
    const snackbarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...config
    };

    return this.snackBar.open(message, action || 'Close', snackbarConfig);
  }

  /**
   * Dismiss all active snackbars
   */
  public dismiss(): void {
    this.snackBar.dismiss();
  }
}
