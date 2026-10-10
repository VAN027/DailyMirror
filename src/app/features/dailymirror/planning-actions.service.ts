import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { Task } from '../tasks/task.model';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { PlannerActions } from '../planner/store/planner.actions';
import { plannerFeature } from '../planner/store/planner.reducer';
import { selectTaskEntities } from '../tasks/store/task.selectors';
import { selectTodayTagTaskIds } from '../tag/store/tag.reducer';
import { selectTodayTaskIds } from '../work-context/store/work-context.selectors';
import { updateTag } from '../tag/store/tag.actions';
import { SnackService } from '../../core/snack/snack.service';
import { CalendarIntegrationService } from '../calendar-integration/calendar-integration.service';
import { RescheduleDialogComponent } from './reschedule-dialog.component';
import { T } from '../../t.const';
import { intervalsOverlap, moveTimeToDay, restoreAffectedOrder } from './planning.util';

@Injectable({ providedIn: 'root' })
export class PlanningActionsService {
  private readonly _store = inject(Store);
  private readonly _snack = inject(SnackService);
  private readonly _dialog = inject(MatDialog);
  private readonly _entities = this._store.selectSignal(selectTaskEntities);
  private readonly _order = this._store.selectSignal(selectTodayTagTaskIds);
  private readonly _today = this._store.selectSignal(selectTodayTaskIds);
  private readonly _plannerDays = this._store.selectSignal(plannerFeature.selectDays);
  private readonly _events = toSignal(
    inject(CalendarIntegrationService).calendarEvents$,
    { initialValue: [] },
  );

  async open(tasks: Task[]): Promise<boolean> {
    const result = await firstValueFrom(
      this._dialog
        .open(RescheduleDialogComponent, {
          autoFocus: false,
        })
        .afterClosed(),
    );
    if (typeof result === 'string' && result) {
      await this.apply(tasks, result);
      return true;
    }
    return false;
  }

  async apply(tasks: Task[], day: string | null): Promise<void> {
    const before = tasks
      .map((task) => this._entities()[task.id])
      .filter((task): task is Task => !!task);
    if (!before.length) return;
    const order = [...this._today()];
    const plannerDays = this._plannerDays();
    for (const task of before) {
      if (!day) {
        this._store.dispatch(
          TaskSharedActions.unscheduleTask({ id: task.id, isSkipToast: true }),
        );
      } else if (task.dueWithTime) {
        const time = moveTimeToDay(task.dueWithTime, day);
        this._store.dispatch(
          TaskSharedActions.scheduleTaskWithTime({
            task,
            dueWithTime: time,
            remindAt: task.remindAt ? time + task.remindAt - task.dueWithTime : undefined,
            isMoveToBacklog: false,
          }),
        );
      } else {
        this._store.dispatch(
          PlannerActions.planTaskForDay({ task, day, isShowSnack: false }),
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    const affected = new Set(before.map((task) => task.id));
    // Native timed scheduling inserts at the top. Keep existing positions and
    // append newly arriving tasks in the user's selection order instead.
    const currentOrder = this._order();
    const newcomers = before
      .map((task) => task.id)
      .filter((id) => !order.includes(id) && currentOrder.includes(id));
    const restored = restoreAffectedOrder(currentOrder, order, affected);
    const nextOrder = [...restored.filter((id) => !newcomers.includes(id)), ...newcomers];
    if (nextOrder.some((id, index) => currentOrder[index] !== id)) {
      this._store.dispatch(
        updateTag({
          tag: { id: 'TODAY', changes: { taskIds: nextOrder } },
          isSkipSnack: true,
        }),
      );
    }
    const conflicts = this.conflictsFor(affected);
    this._snack.open({
      msg: conflicts.length ? T.DM.CONFLICT : T.DM.UPDATED,
      type: conflicts.length ? 'WARNING' : 'SUCCESS',
      actionStr: T.G.UNDO,
      actionFn: async () => {
        for (const original of before) {
          const live = this._entities()[original.id];
          if (!live) continue;
          if (original.dueWithTime) {
            this._store.dispatch(
              TaskSharedActions.scheduleTaskWithTime({
                task: live,
                dueWithTime: original.dueWithTime,
                remindAt: original.remindAt,
                isMoveToBacklog: false,
              }),
            );
          } else if (original.dueDay) {
            this._store.dispatch(
              PlannerActions.planTaskForDay({
                task: live,
                day: original.dueDay,
                isShowSnack: false,
              }),
            );
          } else {
            this._store.dispatch(
              TaskSharedActions.unscheduleTask({ id: live.id, isSkipToast: true }),
            );
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
        for (const [originalDay, ids] of Object.entries(plannerDays)) {
          if (!ids.some((id) => affected.has(id))) continue;
          const current = this._plannerDays()[originalDay] ?? [];
          this._store.dispatch(
            PlannerActions.upsertPlannerDay({
              day: originalDay,
              taskIds: restoreAffectedOrder(current, ids, affected),
            }),
          );
        }
        this._store.dispatch(
          updateTag({
            tag: {
              id: 'TODAY',
              changes: {
                taskIds: restoreAffectedOrder(this._today(), order, affected),
              },
            },
            isSkipSnack: true,
          }),
        );
      },
    });
  }

  conflictsFor(ids: Set<string>): string[] {
    const all = Object.values(this._entities()).filter(
      (task): task is Task => !!task && !task.isDone && !!task.dueWithTime,
    );
    const events = this._events()
      .flatMap((entry) => entry.items)
      .filter((event) => !event.isAllDay);
    return all
      .filter(
        (task) =>
          ids.has(task.id) &&
          (all.some(
            (other) =>
              other.id !== task.id &&
              intervalsOverlap(
                task.dueWithTime!,
                task.timeEstimate,
                other.dueWithTime!,
                other.timeEstimate,
              ),
          ) ||
            events.some((event) =>
              intervalsOverlap(
                task.dueWithTime!,
                task.timeEstimate,
                event.start,
                event.duration,
              ),
            )),
      )
      .map((task) => task.id);
  }
}
