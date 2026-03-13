import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeTailoreComponent } from './resume-tailore.component';

describe('ResumeTailoreComponent', () => {
  let component: ResumeTailoreComponent;
  let fixture: ComponentFixture<ResumeTailoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeTailoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumeTailoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
