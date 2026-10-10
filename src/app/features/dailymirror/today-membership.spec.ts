import {
  selectTodayTaskIds,
  selectTodayTagRepair,
} from '../work-context/store/work-context.selectors';
import { DEFAULT_TASK, Task } from '../tasks/task.model';
import { TODAY_TAG } from '../tag/tag.const';
import { fakeEntityStateFromArray } from '../../util/fake-entity-state-from-array';
import {
  selectTaskSchedulingSnapshot,
  selectTaskSchedulingSnapshotRecord,
} from '../tasks/store/task.selectors';
import { initialTaskState } from '../tasks/store/task.reducer';

describe('DailyMirror Today membership', () => {
  const makeTask = (id: string, changes: Partial<Task>): Task => ({
    ...DEFAULT_TASK,
    id,
    title: id,
    projectId: 'INBOX',
    ...changes,
  });
  it('keeps unfinished past plans in stored order, excluding future, done-past and deadline-only tasks', () => {
    const tasks = [
      makeTask('past', { dueDay: '2026-10-01' }),
      makeTask('today', { dueDay: '2026-10-05' }),
      makeTask('timed', { dueWithTime: new Date(2026, 9, 3, 14).getTime() }),
      makeTask('future', { dueDay: '2026-10-06' }),
      makeTask('done', { dueDay: '2026-10-02', isDone: true }),
      makeTask('deadline', { deadlineDay: '2026-10-05' }),
    ];
    const tagState = fakeEntityStateFromArray([
      { ...TODAY_TAG, taskIds: ['timed', 'today', 'past'] },
    ]);
    const taskState = {
      ...initialTaskState,
      ...fakeEntityStateFromArray(tasks),
      ids: tasks.map((task) => task.id),
    };
    const snapshot = selectTaskSchedulingSnapshotRecord.projector(
      selectTaskSchedulingSnapshot.projector(tasks),
    );
    expect(selectTodayTaskIds.projector(tagState, snapshot, '2026-10-05', 0)).toEqual([
      'timed',
      'today',
      'past',
    ]);
    expect(
      selectTodayTagRepair.projector(tagState, taskState, '2026-10-05', 0),
    ).toBeNull();
  });
  it('removes an unscheduled task even when its old order and deadline remain', () => {
    const task = makeTask('a', {
      dueDay: undefined,
      dueWithTime: undefined,
      deadlineDay: '2026-10-05',
    });
    const tags = fakeEntityStateFromArray([{ ...TODAY_TAG, taskIds: ['a'] }]);
    const snapshot = selectTaskSchedulingSnapshotRecord.projector(
      selectTaskSchedulingSnapshot.projector([task]),
    );
    expect(selectTodayTaskIds.projector(tags, snapshot, '2026-10-05', 0)).toEqual([]);
  });
});
