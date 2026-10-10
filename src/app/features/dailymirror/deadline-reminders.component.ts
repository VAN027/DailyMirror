import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButton } from '@angular/material/button';
import { selectAllTasksInActiveProjects } from '../tasks/store/task.selectors';
import { DateService } from '../../core/date/date.service';
import { NavigateToTaskService } from '../../core-ui/navigate-to-task/navigate-to-task.service';
import { TaskService } from '../tasks/task.service';
import { LocaleDatePipe } from '../../ui/pipes/locale-date.pipe';
import { getDbDateStr } from '../../util/get-db-date-str';
import { T } from '../../t.const';

@Component({
  selector: 'dm-deadline-reminders',
  imports: [TranslatePipe, MatButton, LocaleDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (reminders().length) {
      <details open>
        <summary>{{ T.DM.DEADLINE | translate }} ({{ reminders().length }})</summary>
        @for (task of reminders(); track task.id) {
          <div>
            <button
              mat-button
              (click)="navigate.navigate(task.id)"
            >
              {{ task.title }}
            </button>
            <span>{{
              task.deadlineWithTime || task.deadlineDay | localeDate: 'MM-dd'
            }}</span>
            <button
              mat-button
              (click)="tasks.scheduleForTodayById(task.id)"
            >
              {{ T.F.TASK.CMP.ADD_TO_MY_DAY | translate }}
            </button>
          </div>
        }
      </details>
    }
  `,
  styles: `
    details {
      margin-block: var(--s2);
      padding: var(--s);
      border: 1px solid var(--extra-border-color);
      border-radius: var(--s);
    }
    summary {
      cursor: pointer;
    }
    div {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--s);
    }
  `,
})
export class DeadlineRemindersComponent {
  readonly T = T;
  readonly navigate = inject(NavigateToTaskService);
  readonly tasks = inject(TaskService);
  private readonly _date = inject(DateService);
  private readonly _all = inject(Store).selectSignal(selectAllTasksInActiveProjects);
  readonly reminders = computed(() => {
    const today = this._date.todayStr();
    return this._all().filter((task) => {
      const deadline = task.deadlineWithTime
        ? getDbDateStr(new Date(task.deadlineWithTime))
        : task.deadlineDay;
      return !task.isDone && !!deadline && deadline <= today;
    });
  });
}
