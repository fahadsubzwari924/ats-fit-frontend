import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HistoryTabComponent } from './history-tab.component';
import { UserState } from '@core/states/user.state';
import { httpClientTestProviders } from '@testing/http-client-test.providers';

describe('HistoryTabComponent', () => {
  let component: HistoryTabComponent;
  let fixture: ComponentFixture<HistoryTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryTabComponent],
      providers: [
        provideRouter([]),
        ...httpClientTestProviders,
        {
          provide: UserState,
          useValue: { currentUser: () => null },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
