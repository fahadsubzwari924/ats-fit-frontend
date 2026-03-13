import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionTitleAndDetailComponent } from './section-title-and-detail.component';

describe('SectionTitleAndDetailComponent', () => {
  let component: SectionTitleAndDetailComponent;
  let fixture: ComponentFixture<SectionTitleAndDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionTitleAndDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectionTitleAndDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
