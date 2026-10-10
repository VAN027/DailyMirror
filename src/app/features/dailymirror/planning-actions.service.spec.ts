import { TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { PlanningActionsService } from './planning-actions.service';
import { TaskService } from '../tasks/task.service';
import { DEFAULT_TASK, Task } from '../tasks/task.model';
import { selectTaskEntities } from '../tasks/store/task.selectors';
import { selectTodayTagTaskIds } from '../tag/store/tag.reducer';
import { selectTodayTaskIds } from '../work-context/store/work-context.selectors';
import { plannerFeature } from '../planner/store/planner.reducer';
import { SnackService } from '../../core/snack/snack.service';
import { CalendarIntegrationService } from '../calendar-integration/calendar-integration.service';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { PlannerActions } from '../planner/store/planner.actions';

describe('DailyMirror planning actions', () => {
  let service: PlanningActionsService;
  let store: MockStore;
  let task: Task;
  let snack: jasmine.SpyObj<SnackService>;
  beforeEach(() => {
    task = {
      ...DEFAULT_TASK,
      id: 'a',
      title: 'A',
      projectId: 'INBOX',
      dueWithTime: new Date(2026, 9, 5, 14).getTime(),
      remindAt: new Date(2026, 9, 5, 13, 50).getTime(),
      timeEstimate: 3600000,
      deadlineDay: '2026-10-10',
      dailymirrorQuadrant: 2,
    };
    snack = jasmine.createSpyObj<SnackService>('SnackService', ['open']);
    TestBed.configureTestingModule({
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectTaskEntities, value: { a: task } },
            { selector: selectTodayTagTaskIds, value: ['a', 'b'] },
            { selector: selectTodayTaskIds, value: ['a', 'b'] },
            { selector: plannerFeature.selectDays, value: {} },
          ],
        }),
        { provide: TaskService, useValue: { update: jasmine.createSpy('update') } },
        { provide: SnackService, useValue: snack },
        { provide: MatDialog, useValue: {} },
        { provide: CalendarIntegrationService, useValue: { calendarEvents$: of([]) } },
      ],
    });
    store = TestBed.inject(MockStore);
    service = TestBed.inject(PlanningActionsService);
  });
  it('reschedules with the same local clock time and reminder offset', async () => {
    const dispatch = spyOn(store, 'dispatch');
    await service.apply([task], '2026-10-06');
    expect(dispatch).toHaveBeenCalledWith(
      TaskSharedActions.scheduleTaskWithTime({
        task,
        dueWithTime: new Date(2026, 9, 6, 14).getTime(),
        remindAt: new Date(2026, 9, 6, 13, 50).getTime(),
        isMoveToBacklog: false,
      }),
    );
    expect(task.deadlineDay).toBe('2026-10-10');
    expect(task.dailymirrorQuadrant).toBe(2);
  });
  it('unschedules through the native action and provides undo of the original timed plan', async () => {
    const dispatch = spyOn(store, 'dispatch');
    await service.apply([task], null);
    expect(dispatch).toHaveBeenCalledWith(
      TaskSharedActions.unscheduleTask({ id: 'a', isSkipToast: true }),
    );
    const notification = snack.open.calls.mostRecent().args[0];
    if (typeof notification === 'string')
      throw new Error('Expected an undo notification');
    const undo = notification.actionFn;
    expect(undo).toBeDefined();
    await undo!();
    expect(dispatch).toHaveBeenCalledWith(
      TaskSharedActions.scheduleTaskWithTime({
        task,
        dueWithTime: task.dueWithTime!,
        remindAt: task.remindAt,
        isMoveToBacklog: false,
      }),
    );
  });
  it('detects overlap without changing tasks', () => {
    store.overrideSelector(selectTaskEntities, {
      a: task,
      b: { ...task, id: 'b', dueWithTime: task.dueWithTime! + 1800000 },
    });
    store.refreshState();
    expect(service.conflictsFor(new Set(['a']))).toEqual(['a']);
    expect(task.dueWithTime).toBe(new Date(2026, 9, 5, 14).getTime());
  });
  it('undo restores a future planner position without resetting unrelated order', async () => {
    const planned = { ...task, dueWithTime: undefined, dueDay: '2026-10-06' };
    store.overrideSelector(selectTaskEntities, { a: planned });
    store.overrideSelector(plannerFeature.selectDays, {
      ['2026-10-06']: ['x', 'a', 'b'],
    });
    store.refreshState();
    const dispatch = spyOn(store, 'dispatch');
    await service.apply([planned], '2026-10-07');
    store.overrideSelector(plannerFeature.selectDays, {
      ['2026-10-06']: ['b', 'a', 'new', 'x'],
    });
    store.refreshState();
    const notification = snack.open.calls.mostRecent().args[0];
    if (typeof notification === 'string') throw new Error('Expected undo');
    await notification.actionFn!();
    expect(dispatch).toHaveBeenCalledWith(
      PlannerActions.upsertPlannerDay({
        day: '2026-10-06',
        taskIds: ['a', 'b', 'new', 'x'],
      }),
    );
  });
});
