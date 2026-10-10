import { intervalsOverlap, moveTimeToDay, restoreAffectedOrder } from './planning.util';

describe('DailyMirror planning rules', () => {
  it('preserves local time when moving a timed task across dates', () => {
    const original = new Date(2026, 9, 5, 14, 30).getTime();
    const moved = new Date(moveTimeToDay(original, '2026-10-06'));
    expect([
      moved.getFullYear(),
      moved.getMonth(),
      moved.getDate(),
      moved.getHours(),
      moved.getMinutes(),
    ]).toEqual([2026, 9, 6, 14, 30]);
  });
  it('allows adjacent appointments and ignores entries without duration', () => {
    expect(intervalsOverlap(100, 60, 160, 60)).toBeFalse();
    expect(intervalsOverlap(100, 60, 159, 60)).toBeTrue();
    expect(intervalsOverlap(100, 0, 100, 60)).toBeFalse();
  });
  it('restores affected positions while preserving new tasks and unrelated reordering', () => {
    expect(
      restoreAffectedOrder(
        ['d', 'new', 'b', 'a', 'c'],
        ['a', 'b', 'c', 'd'],
        new Set(['a', 'c']),
      ),
    ).toEqual(['c', 'd', 'new', 'a', 'b']);
  });
  it('does not resurrect deleted tasks or duplicate restored tasks', () => {
    expect(
      restoreAffectedOrder(['b', 'c'], ['a', 'b', 'c'], new Set(['a', 'c'])),
    ).toEqual(['b', 'c']);
  });
});
