import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentUsageCardComponent } from './current-usage-card.component';

describe('CurrentUsageCardComponent', () => {
  let component: CurrentUsageCardComponent;
  let fixture: ComponentFixture<CurrentUsageCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrentUsageCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurrentUsageCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
