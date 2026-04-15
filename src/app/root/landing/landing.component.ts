import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
// Components
import { FeatureCardComponent } from '@root/landing/components/feature-card/feature-card.component';
import { PriceCardComponent } from '@root/landing/components/price-card/price-card.component';
import { JobStoryCardComponent } from '@root/landing/components/job-stroy-card/job-story-card.component';
import { TailorApplyModalComponent } from '@features/tailor-apply/tailor-apply-modal.component';
// Services
import { PlatformDataService } from '@root/landing/services/platform-data.service';
import { ModalService } from '@shared/services/modal.service';
import { ResumeService } from '@shared/services/resume.service';
// Interfaces
import { IFeature } from '@root/landing/interfaces/feature.interface';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { ITestimonial } from '@root/landing/interfaces/testimonial.interface';
import {
  BILLING_CYCLE,
  BillingCycle,
} from '@root/landing/constants/pricing.constants';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FeatureCardComponent, PriceCardComponent, JobStoryCardComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnInit {
  readonly BILLING_CYCLE = BILLING_CYCLE;

  // Inject dependencies
  private readonly destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private meta = inject(Meta);
  private title = inject(Title);
  private modalService = inject(ModalService);
  private platformDataService = inject(PlatformDataService);
  private resumeService = inject(ResumeService);

  mobileMenuOpen = signal(false);
  showWizard = signal(false);
  canGenerateResume = signal(false);
  isAuthenticated = signal(false);
  selectedCycle = signal<BillingCycle>(BILLING_CYCLE.MONTHLY);

  public features = signal<IFeature[]>([]);
  public pricingPlans = signal<IPricing[]>([]);
  public testimonials = signal<ITestimonial[]>([]);

  // Use cached templates from service
  public templates = this.resumeService.availableTemplates;
  ngOnInit(): void {
    this.setSEO();
    this.initializeContent();
  }

  private setSEO(): void {
    // Set page title
    this.title.setTitle(
      'ResumeAI - AI-Powered Resume Builder & ATS Optimization Tool'
    );

    // Set meta tags for SEO
    this.meta.addTags([
      {
        name: 'description',
        content:
          'Create professional, ATS-optimized resumes with ResumeAI. Our AI-powered platform helps you tailor your resume for specific job descriptions and improve your ATS score.',
      },
      {
        name: 'keywords',
        content:
          'resume builder, ATS optimization, job application, career tools, professional resume, AI resume, resume template',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'ResumeAI' },
      {
        property: 'og:title',
        content: 'ResumeAI - AI-Powered Resume Builder & ATS Optimization Tool',
      },
      {
        property: 'og:description',
        content:
          'Create professional, ATS-optimized resumes with ResumeAI. Our AI-powered platform helps you tailor your resume for specific job descriptions and improve your ATS score.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://resumeai.com' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'ResumeAI - AI-Powered Resume Builder & ATS Optimization Tool',
      },
      {
        name: 'twitter:description',
        content:
          'Create professional, ATS-optimized resumes with ResumeAI. Our AI-powered platform helps you tailor your resume for specific job descriptions and improve your ATS score.',
      },
    ]);
  }

  private initializeContent(): void {
    forkJoin([
      this.platformDataService.getFeatures(),
      this.platformDataService.getPricingPlans(),
      this.platformDataService.getTestimonials(),
      this.resumeService.getResumeTemplates(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([features, pricingPlans, testimonials]) => {
      this.features.set(features ?? []);
      this.pricingPlans.set(pricingPlans ?? []);
      this.testimonials.set(testimonials ?? []);
    });
  }

  public openResumeModal(): void {
    this.modalService.openModal(TailorApplyModalComponent, undefined, { width: '620px', maxWidth: '95vw', panelClass: 'tailor-modal-panel' });
  }

  handleGetStarted(): void {
    if (this.canGenerateResume()) {
      this.showWizard.set(true);
    } else {
      this.router.navigate(['/pricing']);
    }
  }

  closeWizard(): void {
    this.showWizard.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((current) => !current);
  }
}
