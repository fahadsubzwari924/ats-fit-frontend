import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyNewJobModalComponent } from '../apply-new-job-modal.component';

describe('ApplyNewJobModalComponent', () => {
  let component: ApplyNewJobModalComponent;
  let fixture: ComponentFixture<ApplyNewJobModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyNewJobModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyNewJobModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
