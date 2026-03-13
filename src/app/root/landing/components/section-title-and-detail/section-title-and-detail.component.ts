import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-title-and-detail',
  standalone: true,
  imports: [],
  templateUrl: './section-title-and-detail.component.html',
  styleUrl: './section-title-and-detail.component.scss'
})
export class SectionTitleAndDetailComponent {

  title = input<string>('');
  detail = input<string>('');

}
