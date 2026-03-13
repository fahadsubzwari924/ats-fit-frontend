import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMethodCardComponent } from './payment-method-card.component';

describe('PaymentMethodCardComponent', () => {
  let component: PaymentMethodCardComponent;
  let fixture: ComponentFixture<PaymentMethodCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentMethodCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
