import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-discard-changes-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="discard-dialog">
      <h2 class="discard-dialog__title">Discard unsaved changes?</h2>
      <p class="discard-dialog__body">
        You have unsaved changes. If you leave now they will be lost.
      </p>
      <div class="discard-dialog__actions">
        <button
          type="button"
          class="discard-dialog__btn discard-dialog__btn--cancel"
          (click)="onKeep()"
        >
          Keep editing
        </button>
        <button
          type="button"
          class="discard-dialog__btn discard-dialog__btn--discard"
          (click)="onDiscard()"
        >
          Discard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .discard-dialog {
      padding: 1.5rem;
      max-width: 400px;
    }

    .discard-dialog__title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .discard-dialog__body {
      margin: 0 0 1.5rem;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #64748b;
    }

    .discard-dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.625rem;
    }

    .discard-dialog__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

      &--cancel {
        color: #475569;
        background: #f1f5f9;
        border-color: #e2e8f0;

        &:hover {
          background: #e2e8f0;
        }

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #2563eb;
        }
      }

      &--discard {
        color: #fff;
        background: #ef4444;
        border-color: #ef4444;

        &:hover {
          background: #dc2626;
        }

        &:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px #fff, 0 0 0 4px #ef4444;
        }
      }
    }
  `],
})
export class DiscardChangesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DiscardChangesDialogComponent, boolean>);

  onKeep(): void {
    this.dialogRef.close(false);
  }

  onDiscard(): void {
    this.dialogRef.close(true);
  }
}
