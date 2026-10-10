import { taskSharedSchedulingMetaReducer } from '../../root-store/meta/task-shared-meta-reducers/task-shared-scheduling.reducer';
import { createStateWithExistingTasks } from '../../root-store/meta/task-shared-meta-reducers/test-utils';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { RootState } from '../../root-store/root-state';

describe('DailyMirror Today insertion and legacy replay', () => {
  const reducer = taskSharedSchedulingMetaReducer((state) => state);
  it('appends incoming tasks in selection order when requested', () => {
    const state = createStateWithExistingTasks(['new1', 'new2'], [], [], ['old']);
    const result = reducer(
      state,
      TaskSharedActions.planTasksForToday({
        taskIds: ['new1', 'new2'],
        today: '2026-10-05',
        isAddToBottom: true,
      }),
    ) as RootState;
    expect(result.tag.entities.TODAY?.taskIds).toEqual(['old', 'new1', 'new2']);
    expect(state.tag.entities.TODAY?.taskIds).toEqual(['old']);
  });
  it('keeps the original insertion behavior when replaying older operations', () => {
    const state = createStateWithExistingTasks(['new1'], [], [], ['old']);
    const result = reducer(
      state,
      TaskSharedActions.planTasksForToday({
        taskIds: ['new1'],
        today: '2026-10-05',
      }),
    ) as RootState;
    expect(result.tag.entities.TODAY?.taskIds).toEqual(['new1', 'old']);
  });
});
