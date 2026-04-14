import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverviewTabComponent } from './overview-tab.component';
import { UserState } from '@core/states/user.state';
import { httpClientTestProviders } from '@testing/http-client-test.providers';

describe('OverviewTabComponent', () => {
  let component: OverviewTabComponent;
  let fixture: ComponentFixture<OverviewTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewTabComponent],
      providers: [
        ...httpClientTestProviders,
        {
          provide: UserState,
          useValue: { currentUser: () => null },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverviewTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
