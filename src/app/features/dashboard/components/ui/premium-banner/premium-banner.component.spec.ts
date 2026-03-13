import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremiumBannerComponent } from './premium-banner.component';

describe('PremiumBannerComponent', () => {
  let component: PremiumBannerComponent;
  let fixture: ComponentFixture<PremiumBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PremiumBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
