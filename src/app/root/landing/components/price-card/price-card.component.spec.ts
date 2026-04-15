import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PriceCardComponent } from './price-card.component';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { PriceCardType } from '@root/landing/enums/price-card-type.enum';
import { BILLING_CYCLE } from '@root/landing/constants/pricing.constants';

const FREEMIUM_PLAN: IPricing = {
  title: 'Freemium',
  price: 'Free',
  description: 'Get started',
  icon: '/icon.svg',
  buttonText: 'Sign up free',
  buttonLink: '/signup',
  features: ['3 tailored resumes/month'],
  type: PriceCardType.REGISTERED,
};

const PRO_PLAN: IPricing = {
  title: 'Pro',
  price: '$12/mo',
  annualPrice: '$89/yr',
  annualSavingsBadge: 'Save 38%',
  description: 'Full toolkit',
  icon: '/icon2.svg',
  isPopular: true,
  buttonText: 'Get Pro',
  buttonLink: '/signup',
  features: ['30 tailored resumes/month'],
  type: PriceCardType.PRO,
};

describe('PriceCardComponent', () => {
  let component: PriceCardComponent;
  let fixture: ComponentFixture<PriceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriceCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('priceDisplay computed', () => {
    it('returns monthly price and null badge on monthly cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      expect(component.priceDisplay().price).toBe('$12/mo');
      expect(component.priceDisplay().badge).toBeNull();
    });

    it('returns annual price and savings badge on annual cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(component.priceDisplay().price).toBe('$89/yr');
      expect(component.priceDisplay().badge).toBe('Save 38%');
    });

    it('returns monthly price when annual cycle selected but no annualPrice set', () => {
      fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(component.priceDisplay().price).toBe('Free');
      expect(component.priceDisplay().badge).toBeNull();
    });
  });

  describe('template rendering', () => {
    it('shows monthly price in DOM by default', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('$12/mo');
      expect(fixture.nativeElement.textContent).not.toContain('$89/yr');
    });

    it('shows annual price and savings badge in DOM on annual cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('$89/yr');
      expect(fixture.nativeElement.textContent).toContain('Save 38%');
    });

    it('does not show savings badge on monthly cycle', () => {
      fixture.componentRef.setInput('priceCard', PRO_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Save 38%');
    });

    it('freemium card never shows savings badge', () => {
      fixture.componentRef.setInput('priceCard', FREEMIUM_PLAN);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.ANNUAL);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Free');
      expect(fixture.nativeElement.textContent).not.toContain('Save 38%');
    });

    it('renders grouped feature with title and sub-bullets on one logical block', () => {
      const planWithGroup: IPricing = {
        ...PRO_PLAN,
        features: [
          {
            title: 'Batch generation',
            subitems: ['Up to 3 jobs/batch', '10 batches/month'],
          },
        ],
      };
      fixture.componentRef.setInput('priceCard', planWithGroup);
      fixture.componentRef.setInput('selectedCycle', BILLING_CYCLE.MONTHLY);
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Batch generation');
      expect(text).toContain('Up to 3 jobs/batch');
      expect(text).toContain('10 batches/month');
      expect(text).not.toContain('Batch generation (up to');
    });
  });
});
