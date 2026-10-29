import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';
import { QuadrantsComponent } from '../../dailymirror/quadrants.component';
import { MobileBoardsComponent } from './mobile-boards.component';

// Inherit the existing board initialization and legacy-tag migration unchanged.
@Component({
  selector: 'dm-mobile-quadrants',
  imports: [MatButton, TranslatePipe, MobileBoardsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host,
    mobile-boards {
      display: block;
      height: 100%;
      min-height: 0;
    }
  `,
  template: `
    @if (isReady()) {
      @if (board(); as cfg) {
        <mobile-boards
          [initialBoardId]="cfg.id"
          [completedToggleBoardId]="cfg.id"
          [hideCompleted]="hideDone()"
          (hideCompletedChange)="preferences.update({ hideCompleted: $event })"
        />
      } @else {
        <button
          mat-button
          (click)="restoreBoard()"
        >
          {{ T.G.ADD | translate }} ·
          {{ T.F.BOARDS.DEFAULT.EISENHAUER_MATRIX | translate }}
        </button>
      }
    }
  `,
})
export class MobileQuadrantsComponent extends QuadrantsComponent {}
