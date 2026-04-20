import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-cancel-subscription-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './cancel-subscription-dialog.component.html',
})
export class CancelSubscriptionDialogComponent {
  private dialogRef = inject(MatDialogRef<CancelSubscriptionDialogComponent>);

  confirm(): void {
    this.dialogRef.close(true);
  }

  dismiss(): void {
    this.dialogRef.close(false);
  }
}
