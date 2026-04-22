import { Injectable, inject, Type } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private matDialog = inject(MatDialog);

  public openModal<T>(
    component: Type<T>,
    data?: unknown,
    config?: Partial<MatDialogConfig>,
  ): MatDialogRef<T> {
    if (!component) {
      throw new Error('A valid component must be provided to openModal.');
    }
    return this.matDialog.open<T>(component, {
      hasBackdrop: true,
      disableClose: true,
      data: data,
      ...config,
    });
  }

  public closeModal<T>(dialogRef: MatDialogRef<T>): void {
    if (dialogRef) {
      dialogRef.close();
    }
  }

  public closeAllModals(): void {
    this.matDialog.closeAll();
  }
}
