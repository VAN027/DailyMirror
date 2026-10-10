import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { MatButton } from '@angular/material/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { BoardsComponent } from '../boards/boards.component';
import { DEFAULT_BOARDS } from '../boards/boards.const';
import { selectAllBoards } from '../boards/store/boards.selectors';
import { BoardsActions } from '../boards/store/boards.actions';
import { selectAllTasks } from '../tasks/store/task.selectors';
import { selectAllTagIds } from '../tag/store/tag.reducer';
import { addTag } from '../tag/store/tag.actions';
import { IMPORTANT_TAG, IN_PROGRESS_TAG, URGENT_TAG } from '../tag/tag.const';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { SyncTriggerService } from '../../imex/sync/sync-trigger.service';
import { DisplayPreferencesService } from './display-preferences.service';
import { legacyQuadrantTags } from './legacy-quadrant-tags';
import { T } from '../../t.const';

@Component({
  selector: 'dm-quadrants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButton, TranslatePipe, BoardsComponent],
  styles: `
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }
    boards {
      display: block;
      height: 100%;
    }
  `,
  template: `
    @if (isReady()) {
      @if (board(); as cfg) {
        <boards
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
export class QuadrantsComponent {
  readonly T = T;
  readonly isReady = signal(false);
  readonly preferences = inject(DisplayPreferencesService);
  private readonly _store = inject(Store);
  private readonly _translate = inject(TranslateService);
  private readonly _boards = this._store.selectSignal(selectAllBoards);
  readonly board = computed(() =>
    this._boards().find((board) => board.id === DEFAULT_BOARDS[0].id),
  );
  readonly hideDone = computed(
    () => this.preferences.preferences().hideCompleted ?? true,
  );

  constructor() {
    inject(SyncTriggerService)
      .afterInitialSyncDoneAndDataLoadedInitially$.pipe(
        filter(Boolean),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        void this._migrateLegacyClassification();
      });
  }

  restoreBoard(): void {
    this._store.dispatch(BoardsActions.addBoard({ board: DEFAULT_BOARDS[0] }));
  }

  private async _migrateLegacyClassification(): Promise<void> {
    // Compatibility only: all subsequent classification uses the native board tags.
    const tasks = this._store.selectSignal(selectAllTasks)();
    const existing = new Set<string | number>(
      this._store.selectSignal(selectAllTagIds)(),
    );
    // Native matrix and progress boards use these normal, visible tags.
    // Initialize once after hydration, preserving existing tag names and settings.
    for (const tag of [IMPORTANT_TAG, URGENT_TAG, IN_PROGRESS_TAG]) {
      if (!existing.has(tag.id)) {
        this._store.dispatch(
          addTag({ tag: { ...tag, title: this._translate.instant(tag.title) } }),
        );
      }
    }
    for (const task of tasks) {
      const tagIds = legacyQuadrantTags(task);
      if (!tagIds) continue;
      this._store.dispatch(
        TaskSharedActions.updateTask({
          task: {
            id: task.id,
            changes: { tagIds, dailymirrorQuadrant: null },
          },
        }),
      );
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    this.isReady.set(true);
  }
}
