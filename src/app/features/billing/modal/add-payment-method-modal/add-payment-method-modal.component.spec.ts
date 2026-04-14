import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { AddPaymentMethodModalComponent } from './add-payment-method-modal.component';

describe('AddPaymentMethodModalComponent', () => {
  let component: AddPaymentMethodModalComponent;
  let fixture: ComponentFixture<AddPaymentMethodModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPaymentMethodModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPaymentMethodModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
