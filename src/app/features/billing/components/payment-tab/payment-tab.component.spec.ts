import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PaymentTabComponent } from './payment-tab.component';

describe('PaymentTabComponent', () => {
  let component: PaymentTabComponent;
  let fixture: ComponentFixture<PaymentTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentTabComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
