import { animate, style, transition, trigger } from '@angular/animations';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-questions-banner',
  standalone: true,
  templateUrl: './questions-banner.component.html',
  styleUrl: './questions-banner.component.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class QuestionsBannerComponent {
  visible = input<boolean>(false);
  answerClicked = output<void>();
}
