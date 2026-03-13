import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobStoryCardComponent } from './job-story-card.component';

describe('JobStoryCardComponent', () => {
  let component: JobStoryCardComponent;
  let fixture: ComponentFixture<JobStoryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobStoryCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobStoryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
