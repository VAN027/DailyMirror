import { Task } from '../tasks/task.model';
import { IMPORTANT_TAG, URGENT_TAG } from '../tag/tag.const';

/** Convert the retired classification field, retaining every unrelated tag. */
export const legacyQuadrantTags = (
  task: Pick<Task, 'tagIds' | 'dailymirrorQuadrant'>,
): string[] | undefined => {
  const quadrant = task.dailymirrorQuadrant;
  if (quadrant == null) return undefined;
  const tags = task.tagIds.filter(
    (id) => id !== IMPORTANT_TAG.id && id !== URGENT_TAG.id,
  );
  if (quadrant === 1 || quadrant === 2) tags.push(IMPORTANT_TAG.id);
  if (quadrant === 1 || quadrant === 3) tags.push(URGENT_TAG.id);
  return [...new Set(tags)];
};
