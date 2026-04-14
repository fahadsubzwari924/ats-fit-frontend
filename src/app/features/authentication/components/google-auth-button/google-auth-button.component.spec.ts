import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleAuthButtonComponent } from './google-auth-button.component';
import { httpClientTestProviders } from '@testing/http-client-test.providers';

describe('GoogleAuthButtonComponent', () => {
  let component: GoogleAuthButtonComponent;
  let fixture: ComponentFixture<GoogleAuthButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleAuthButtonComponent],
      providers: [...httpClientTestProviders],
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleAuthButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
