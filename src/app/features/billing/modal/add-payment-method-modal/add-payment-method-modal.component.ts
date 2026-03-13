import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-payment-method-modal',
  imports: [],
  templateUrl: './add-payment-method-modal.component.html',
  styleUrl: './add-payment-method-modal.component.scss'
})
export class AddPaymentMethodModalComponent {

  private dialogRef = inject(MatDialogRef<AddPaymentMethodModalComponent>);

  public closeModal(): void {
    this.dialogRef.close();
  }

}
