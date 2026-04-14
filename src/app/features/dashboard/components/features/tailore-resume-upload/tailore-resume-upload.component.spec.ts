import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TailoreResumeUploadComponent } from './tailore-resume-upload.component';
import { httpClientTestProviders } from '@testing/http-client-test.providers';

describe('TailoreResumeUploadComponent', () => {
  let component: TailoreResumeUploadComponent;
  let fixture: ComponentFixture<TailoreResumeUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TailoreResumeUploadComponent],
      providers: [...httpClientTestProviders],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TailoreResumeUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
