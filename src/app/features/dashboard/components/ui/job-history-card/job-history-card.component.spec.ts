import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobHistoryCardComponent } from './job-history-card.component';

describe('JobHistoryCardComponent', () => {
  let component: JobHistoryCardComponent;
  let fixture: ComponentFixture<JobHistoryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobHistoryCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobHistoryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
