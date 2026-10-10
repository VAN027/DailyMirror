import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { DateService } from '../../core/date/date.service';
import { T } from '../../t.const';

@Component({
  selector: 'dm-reschedule-dialog',
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ T.DM.RESCHEDULE | translate }}</h2>
    <mat-dialog-content>
      <label
        >{{ T.DM.DATE | translate }}
        <input
          type="date"
          [(ngModel)]="day"
          [attr.aria-label]="T.DM.DATE | translate"
        />
      </label>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-button
        (click)="dialog.close()"
      >
        {{ T.G.CANCEL | translate }}
      </button>
      <button
        mat-flat-button
        [disabled]="!day"
        (click)="dialog.close(day)"
      >
        {{ T.G.SAVE | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class RescheduleDialogComponent {
  readonly T = T;
  readonly dialog = inject(MatDialogRef<RescheduleDialogComponent, string>);
  day = inject(DateService).todayStr();
}
