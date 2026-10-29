import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
  for (const [bytes, expected] of [
    [0, '0 B'],
    [1023, '1023 B'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [1_048_575, '1024.0 KB'],
    [1024 * 1024, '1.0 MB'],
    [2.5 * 1024 * 1024, '2.5 MB'],
  ] as const) {
    it(`formats ${bytes} bytes as ${expected}`, () => {
      expect(formatFileSize(bytes)).toBe(expected);
    });
  }
});
