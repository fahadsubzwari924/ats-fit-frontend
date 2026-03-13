import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingHistoryCardComponent } from './billing-history-card.component';

describe('BillingHistoryCardComponent', () => {
  let component: BillingHistoryCardComponent;
  let fixture: ComponentFixture<BillingHistoryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingHistoryCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingHistoryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
