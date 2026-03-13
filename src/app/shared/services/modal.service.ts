import { inject, Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // Using inject to get the MatDialog instance
  private matDialog = inject(MatDialog);

  constructor() {}

  public openModal<T>(component: any, data?: any): MatDialogRef<T> {
    if (!component) {
      throw new Error('A valid component must be provided to openModal.');
    }
    return this.matDialog.open<T>(component, {
      hasBackdrop: true,
      disableClose: true,
      data: data,
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
