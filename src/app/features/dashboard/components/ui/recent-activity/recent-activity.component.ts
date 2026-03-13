import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { AtsMatchHistory } from '@features/ats-scoring/models/ats-match-history.model';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.scss'
})
export class RecentActivityComponent {

  activity = input<AtsMatchHistory>();

}
