import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeTailoringModalComponent } from './resume-tailoring-modal.component';

describe('ResumeTailoringModalComponent', () => {
  let component: ResumeTailoringModalComponent;
  let fixture: ComponentFixture<ResumeTailoringModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeTailoringModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeTailoringModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
