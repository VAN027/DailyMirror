import { legacyQuadrantTags } from './legacy-quadrant-tags';
import { IMPORTANT_TAG, URGENT_TAG } from '../tag/tag.const';

describe('legacy quadrant compatibility', () => {
  it('leaves native tasks alone', () => {
    expect(legacyQuadrantTags({ tagIds: [IMPORTANT_TAG.id] })).toBeUndefined();
  });
  it('preserves unrelated tags and translates all five legacy values', () => {
    const expected = [
      [],
      [IMPORTANT_TAG.id, URGENT_TAG.id],
      [IMPORTANT_TAG.id],
      [URGENT_TAG.id],
      [],
    ];
    for (const quadrant of [0, 1, 2, 3, 4] as const) {
      const task = {
        tagIds: ['personal', IMPORTANT_TAG.id, URGENT_TAG.id],
        dailymirrorQuadrant: quadrant,
      };
      expect(legacyQuadrantTags(task)).toEqual(['personal', ...expected[quadrant]]);
      expect(task.tagIds).toEqual(['personal', IMPORTANT_TAG.id, URGENT_TAG.id]);
    }
  });
});
