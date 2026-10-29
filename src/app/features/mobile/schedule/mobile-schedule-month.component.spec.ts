import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MobileScheduleMonthComponent } from './mobile-schedule-month.component';
import { ScheduleService } from '../../schedule/schedule.service';
import { ScheduleEvent } from '../../schedule/schedule.model';
import { SVEType } from '../../schedule/schedule.const';
import { ScheduleEventComponent } from '../../schedule/schedule-event/schedule-event.component';
import { PlannerTaskComponent } from '../../planner/planner-task/planner-task.component';
import { DateTimeFormatService } from '../../../core/date-time-format/date-time-format.service';
import { DEFAULT_TASK, TaskCopy } from '../../tasks/task.model';
import { getDbDateStr } from '../../../util/get-db-date-str';

@Component({ selector: 'planner-task', template: '{{task().title}}' })
class TaskStub {
  task = input.required<TaskCopy>();
  openDetailsOnClick = input(false);
}
@Component({ selector: 'schedule-event', template: '' })
class EventStub {
  event = input.required<ScheduleEvent>();
  isMonthView = input(false);
  cdkDragDisabled = input(false);
}

describe('MobileScheduleMonthComponent', () => {
  let fixture: ComponentFixture<MobileScheduleMonthComponent>;
  const october = Array.from({ length: 35 }, (_, i) =>
    getDbDateStr(new Date(2026, 8, 28 + i)),
  );
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileScheduleMonthComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: DateTimeFormatService,
          useValue: { currentLocale: () => 'en', isoTextLocale: () => null },
        },
        {
          provide: ScheduleService,
          useValue: {
            getEventsForDay: (day: string, events: ScheduleEvent[]) =>
              events.filter((event) => event.plannedForDay === day),
          },
        },
      ],
    })
      .overrideComponent(MobileScheduleMonthComponent, {
        remove: { imports: [PlannerTaskComponent, ScheduleEventComponent] },
        add: { imports: [TaskStub, EventStub] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(MobileScheduleMonthComponent);
    fixture.componentRef.setInput('daysToShow', october);
    fixture.componentRef.setInput('today', '2026-10-25');
    fixture.componentRef.setInput('locale', 'zh');
    fixture.detectChanges();
  });

  it('selects today, exposes all dates and allows selecting a padding date', () => {
    expect(fixture.componentInstance.selectedDay()).toBe('2026-10-25');
    expect(fixture.nativeElement.querySelectorAll('.day-cell').length).toBe(35);
    fixture.nativeElement.querySelector('[data-day="2026-11-01"]').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedDay()).toBe('2026-11-01');
    expect(
      fixture.nativeElement
        .querySelector('[data-day="2026-11-01"]')
        .getAttribute('aria-pressed'),
    ).toBe('true');
    fixture.componentInstance.resetSelection();
    expect(fixture.componentInstance.selectedDay()).toBe('2026-10-25');
  });

  it('shows all six weeks and resets selection to the first day of a future month', () => {
    fixture.componentRef.setInput(
      'daysToShow',
      Array.from({ length: 42 }, (_, i) => getDbDateStr(new Date(2026, 9, 26 + i))),
    );
    fixture.componentRef.setInput('firstDayOfWeek', 1);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedDay()).toBe('2026-11-01');
    expect(fixture.nativeElement.querySelectorAll('.day-cell').length).toBe(42);
    expect(fixture.componentInstance.weekdayHeaders()[0]).toBe('周一');
  });

  it('deduplicates task segments while retaining non-task events and counts', () => {
    const base = {
      style: '',
      startHours: 9,
      timeLeftInHours: 1,
      plannedForDay: '2026-10-25',
    };
    const task = {
      ...DEFAULT_TASK,
      id: 'task-1',
      projectId: 'p',
      title: 'Long task title',
    };
    fixture.componentRef.setInput('events', [
      { ...base, id: 'segment-1', type: SVEType.TaskPlannedForDay, data: task },
      { ...base, id: 'segment-2', type: SVEType.SplitTaskContinued, data: task },
      {
        ...base,
        id: 'calendar-1',
        type: SVEType.CalendarEvent,
        data: { title: 'Calendar appointment' },
      },
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedItems().length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('planner-task').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('schedule-event').length).toBe(1);
    fixture.componentInstance.selectDay('2026-10-26');
    expect(fixture.componentInstance.selectedItems()).toEqual([]);
  });
});
