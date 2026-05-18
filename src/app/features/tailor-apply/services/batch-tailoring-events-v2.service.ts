import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { BatchV2SseEventName } from '../models/batch-tailoring-v2.model';

export interface BatchV2SseEvent {
  name: BatchV2SseEventName;
  data: unknown;
}

export type BatchConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

@Injectable({ providedIn: 'root' })
export class BatchTailoringV2EventsService {
  private readonly zone = inject(NgZone);

  readonly connectionStatus = signal<BatchConnectionStatus>('closed');

  open(batchId: string, accessToken: string): Observable<BatchV2SseEvent> {
    const subject = new Subject<BatchV2SseEvent>();
    let source: EventSource | null = null;

    const baseUrl = environment.baseUrl.replace(/\/$/, '');
    const url =
      `${baseUrl}/resume-tailoring/batch/v2/${batchId}/events` +
      `?access_token=${encodeURIComponent(accessToken)}`;

    const connect = (): void => {
      this.connectionStatus.set('connecting');
      source = new EventSource(url, { withCredentials: true });

      source.onopen = () => {
        this.zone.run(() => this.connectionStatus.set('open'));
      };

      const eventNames: BatchV2SseEventName[] = [
        'snapshot',
        'job_started',
        'job_progress',
        'job_completed',
        'job_failed',
        'batch_completed',
        'heartbeat',
      ];

      for (const name of eventNames) {
        source.addEventListener(name, (e) => {
          const messageEvent = e as MessageEvent;
          this.zone.run(() => {
            try {
              const raw = messageEvent.data;
              const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
              subject.next({ name, data: parsed });
              if (name === 'batch_completed') {
                source?.close();
                this.connectionStatus.set('closed');
                subject.complete();
              }
            } catch (err) {
              console.error('[BatchV2SSE] parse error', err);
            }
          });
        });
      }

      source.onerror = () => {
        this.zone.run(() => {
          // When `batch_completed` fires we intentionally `source.close()` and
          // flip the status to 'closed'. The browser then triggers `onerror`
          // as a side effect of that close — without this guard, the UI would
          // briefly flash a "Reconnecting…" banner right after a successful
          // batch finishes, which looks like a regression to the user.
          if (this.connectionStatus() === 'closed') return;
          this.connectionStatus.set('reconnecting');
        });
      };
    };

    connect();

    return new Observable<BatchV2SseEvent>((subscriber) => {
      const inner = subject.subscribe(subscriber);
      return () => {
        inner.unsubscribe();
        source?.close();
        this.connectionStatus.set('closed');
      };
    });
  }
}
