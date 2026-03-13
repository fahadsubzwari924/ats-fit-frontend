import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPaymentMethodModalComponent } from './add-payment-method-modal.component';

describe('AddPaymentMethodModalComponent', () => {
  let component: AddPaymentMethodModalComponent;
  let fixture: ComponentFixture<AddPaymentMethodModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPaymentMethodModalComponent]
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
