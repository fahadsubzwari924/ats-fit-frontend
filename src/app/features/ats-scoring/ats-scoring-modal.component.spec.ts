import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtsScoringModalComponent } from './ats-scoring-modal.component';

describe('AtsScoringModalComponent', () => {
  let component: AtsScoringModalComponent;
  let fixture: ComponentFixture<AtsScoringModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsScoringModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AtsScoringModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
