import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ScheduleMonthComponent } from '../../schedule/schedule-month/schedule-month.component';
import { ScheduleEventComponent } from '../../schedule/schedule-event/schedule-event.component';
import { PlannerTaskComponent } from '../../planner/planner-task/planner-task.component';
import { parseDbDateStr } from '../../../util/parse-db-date-str';
import { getDbDateStr } from '../../../util/get-db-date-str';
import { T } from '../../../t.const';

@Component({
  selector: 'mobile-schedule-month',
  imports: [TranslatePipe, PlannerTaskComponent, ScheduleEventComponent],
  templateUrl: './mobile-schedule-month.component.html',
  styleUrl: './mobile-schedule-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileScheduleMonthComponent extends ScheduleMonthComponent {
  readonly T = T;
  readonly locale = input('en');
  readonly today = input('');
  private readonly _selection = signal<{ month: string; day: string } | null>(null);
  readonly monthKey = computed(() => getDbDateStr(this.referenceMonth()).slice(0, 7));
  readonly selectedDay = computed(() => {
    const selection = this._selection();
    if (selection?.month === this.monthKey() && this.daysToShow().includes(selection.day))
      return selection.day;
    return this.today().startsWith(this.monthKey())
      ? this.today()
      : `${this.monthKey()}-01`;
  });
  override readonly weekdayHeaders = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(2000, 0, 2 + ((this.firstDayOfWeek() + index) % 7))),
    );
  });
  readonly days = computed(() =>
    this.daysToShow().map((day) => {
      const uniqueEvents = new Map(
        this.getEventsForDay(day).map((event) => {
          const task = event.data && 'subTaskIds' in event.data ? event.data : undefined;
          return [task ? `task:${task.id}` : event.id, { event, task }];
        }),
      );
      return {
        day,
        number: parseDbDateStr(day).getDate(),
        otherMonth: !day.startsWith(this.monthKey()),
        label: new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' }).format(
          parseDbDateStr(day),
        ),
        items: [...uniqueEvents.values()],
      };
    }),
  );
  readonly selectedItems = computed(
    () => this.days().find((day) => day.day === this.selectedDay())?.items || [],
  );
  readonly selectedDateTitle = computed(() =>
    new Intl.DateTimeFormat(this.locale(), {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(parseDbDateStr(this.selectedDay())),
  );
  selectDay(day: string): void {
    this._selection.set({ month: this.monthKey(), day });
  }
  resetSelection(): void {
    this._selection.set(null);
  }
}
