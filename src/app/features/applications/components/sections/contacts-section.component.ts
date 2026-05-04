import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccordionSectionComponent } from '@shared/components/ui/accordion-section/accordion-section.component';

@Component({
  selector: 'app-contacts-section',
  standalone: true,
  imports: [ReactiveFormsModule, AccordionSectionComponent],
  template: `
    <app-accordion-section title="Contacts" [expanded]="false">
      <div [formGroup]="group" class="contacts-section">

        @if (isAllEmpty && group.pristine) {
          <p class="contacts-section__empty-hint">
            Add recruiter and hiring manager contact details here.
          </p>
        }

        <!-- Recruiter name -->
        <div class="app-detail-drawer__field app-detail-drawer__field--full">
          <label
            class="app-detail-drawer__label"
            for="recruiter_name"
          >Recruiter</label>
          <input
            id="recruiter_name"
            type="text"
            class="app-detail-drawer__input"
            formControlName="recruiter_name"
            placeholder="Recruiter name"
            autocomplete="off"
          />
        </div>

        <!-- Recruiter email -->
        <div class="app-detail-drawer__field app-detail-drawer__field--full">
          <label
            class="app-detail-drawer__label"
            for="recruiter_email"
          >Recruiter email</label>
          <input
            id="recruiter_email"
            type="email"
            class="app-detail-drawer__input"
            formControlName="recruiter_email"
            placeholder="recruiter@company.com"
            autocomplete="off"
          />
          @if (
            group.controls['recruiter_email'].invalid &&
            group.controls['recruiter_email'].touched
          ) {
            <span class="contacts-section__field-error" role="alert">
              Invalid email
            </span>
          }
        </div>

        <!-- Hiring manager name -->
        <div class="app-detail-drawer__field app-detail-drawer__field--full">
          <label
            class="app-detail-drawer__label"
            for="hiring_manager_name"
          >Hiring manager</label>
          <input
            id="hiring_manager_name"
            type="text"
            class="app-detail-drawer__input"
            formControlName="hiring_manager_name"
            placeholder="Hiring manager name"
            autocomplete="off"
          />
        </div>

        <!-- Hiring manager email -->
        <div class="app-detail-drawer__field app-detail-drawer__field--full">
          <label
            class="app-detail-drawer__label"
            for="hiring_manager_email"
          >Hiring manager email</label>
          <input
            id="hiring_manager_email"
            type="email"
            class="app-detail-drawer__input"
            formControlName="hiring_manager_email"
            placeholder="hiringmanager@company.com"
            autocomplete="off"
          />
          @if (
            group.controls['hiring_manager_email'].invalid &&
            group.controls['hiring_manager_email'].touched
          ) {
            <span class="contacts-section__field-error" role="alert">
              Invalid email
            </span>
          }
        </div>

      </div>
    </app-accordion-section>
  `,
  styles: [`
    @use 'design-tokens' as *;

    .contacts-section {
      display: flex;
      flex-direction: column;
      gap: $spacing-sm;
    }

    .contacts-section__empty-hint {
      font-size: $font-size-xs;
      color: $color-muted-foreground;
      margin: 0 0 $spacing-xs;
      font-style: italic;
    }

    .contacts-section__field-error {
      font-size: $font-size-xs;
      color: $color-destructive;
      margin-top: $spacing-xs;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsSectionComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;

  ngOnInit(): void {
    const recruiterEmail = this.group.controls['recruiter_email'];
    const hiringManagerEmail = this.group.controls['hiring_manager_email'];

    recruiterEmail.addValidators(Validators.email);
    recruiterEmail.updateValueAndValidity({ emitEvent: false });

    hiringManagerEmail.addValidators(Validators.email);
    hiringManagerEmail.updateValueAndValidity({ emitEvent: false });
  }

  get isAllEmpty(): boolean {
    const v = this.group.getRawValue() as {
      recruiter_name: string | null;
      recruiter_email: string | null;
      hiring_manager_name: string | null;
      hiring_manager_email: string | null;
    };
    return (
      !v.recruiter_name &&
      !v.recruiter_email &&
      !v.hiring_manager_name &&
      !v.hiring_manager_email
    );
  }
}
