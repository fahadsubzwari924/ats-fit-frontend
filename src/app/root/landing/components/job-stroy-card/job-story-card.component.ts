import { Component, input } from '@angular/core';
// Interfaces
import { ITestimonial } from '@root/landing/interfaces/testimonial.interface';

@Component({
  selector: 'app-job-story-card',
  imports: [],
  templateUrl: './job-story-card.component.html',
  styleUrl: './job-story-card.component.scss'
})
export class JobStoryCardComponent {

  testimonial = input<ITestimonial>();

}
