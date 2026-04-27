import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type InlineAlertType = 'error' | 'success' | 'info';

@Component({
  selector: 'app-inline-alert',
  standalone: true,
  templateUrl: './inline-alert.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineAlertComponent {
  message = input<string | null>(null);
  type = input<InlineAlertType>('error');

  readonly containerClasses = computed(() => {
    const base = 'flex items-center gap-3 rounded-md border-l-4 px-4 py-3 text-sm mb-4';
    const variants: Record<InlineAlertType, string> = {
      error: 'bg-red-50 border-red-500 text-red-700',
      success: 'bg-green-50 border-green-500 text-green-700',
      info: 'bg-blue-50 border-blue-500 text-blue-700',
    };
    return `${base} ${variants[this.type()]}`;
  });

  readonly iconPath = computed(() => {
    const icons: Record<InlineAlertType, string> = {
      error:
        'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
      success:
        'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      info:
        'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8.25h.008v.008H12V8.25z',
    };
    return icons[this.type()];
  });
}
