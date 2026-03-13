import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IFeature } from '@root/landing/interfaces/feature.interface';
import { IPricing } from '@root/landing/interfaces/pricing.interface';
import { ITestimonial } from '@root/landing/interfaces/testimonial.interface';

@Injectable({
  providedIn: 'root',
})
export class PlatformDataService {

  constructor(private http: HttpClient) {}

  getFeatures(): Observable<IFeature[]> {
    return this.http.get<IFeature[]>('json/features.json');
  }

  getPricingPlans(): Observable<IPricing[]> {
    return this.http.get<IPricing[]>('json/pricing.json');
  }

  getTestimonials(): Observable<ITestimonial[]> {
    return this.http.get<ITestimonial[]>('json/testimonials.json');
  }

}
