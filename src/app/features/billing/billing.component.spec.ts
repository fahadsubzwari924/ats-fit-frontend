import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BillingComponent } from './billing.component';
import { UserState } from '@core/states/user.state';
import { httpClientTestProviders } from '@testing/http-client-test.providers';

describe('BillingComponent', () => {
  let component: BillingComponent;
  let fixture: ComponentFixture<BillingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent, RouterTestingModule],
      providers: [
        ...httpClientTestProviders,
        {
          provide: UserState,
          useValue: {
            currentUser: () => null,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
