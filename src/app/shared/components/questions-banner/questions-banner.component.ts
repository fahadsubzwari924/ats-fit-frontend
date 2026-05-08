import { animate, style, transition, trigger } from '@angular/animations';
import { Component, input, output } from '@angular/core';

export type QuestionsBannerMode = 'pending' | 'review';

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
  /** `pending` = unanswered remaining; `review` = all answered, user can view/edit. */
  mode = input<QuestionsBannerMode>('pending');
  answeredCount = input<number>(0);
  totalCount = input<number>(0);
  answerClicked = output<void>();
}
