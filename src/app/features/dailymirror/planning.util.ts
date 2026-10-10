export const moveTimeToDay = (timestamp: number, day: string): number => {
  const [year, month, date] = day.split('-').map(Number);
  const time = new Date(timestamp);
  return new Date(
    year,
    month - 1,
    date,
    time.getHours(),
    time.getMinutes(),
    time.getSeconds(),
    time.getMilliseconds(),
  ).getTime();
};

export const intervalsOverlap = (
  a: number,
  aDuration: number,
  b: number,
  bDuration: number,
): boolean => aDuration > 0 && bDuration > 0 && a < b + bDuration && b < a + aDuration;

// Restore only the affected IDs; leave unrelated tasks (including newly added ones)
// in their current relative order.
export const restoreAffectedOrder = (
  current: string[],
  before: string[],
  affected: Set<string>,
): string[] => {
  const result = current.filter((id) => !affected.has(id));
  for (const id of before.filter(
    (value) => affected.has(value) && current.includes(value),
  )) {
    const next = before
      .slice(before.indexOf(id) + 1)
      .find((value) => result.includes(value));
    result.splice(next ? result.indexOf(next) : result.length, 0, id);
  }
  return [...result, ...current.filter((id) => affected.has(id) && !before.includes(id))];
};
