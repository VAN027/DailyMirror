const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateChangelog } = require('./check-dailymirror-changelog');

const complete =
  '## [19.1.6] - 2026-10-27\n\n状态：本地构建。\n\n### 修复\n\n- 修复任务描述保存问题。\n';

test('accepts a completed version alongside unreleased notes and older entries', () => {
  assert.doesNotThrow(() =>
    validateChangelog(
      `# 日志\n\n## 待发布\n\n- TODO\n\n${complete}\n## [19.1.5] - 2026-10-26\n`,
      '19.1.6',
    ),
  );
});

test('requires the exact current package version, not another version or a prefix', () => {
  assert.throws(() => validateChangelog(complete, '19.1.7'), /exactly one/);
  assert.throws(
    () => validateChangelog(complete.replace('[19.1.6]', '[19.1.6-beta.1]'), '19.1.6'),
    /exactly one/,
  );
});

test('rejects duplicate version sections', () => {
  assert.throws(() => validateChangelog(complete + complete, '19.1.6'), /exactly one/);
});

test('requires a dated version heading', () => {
  assert.throws(
    () => validateChangelog(complete.replace(' - 2026-10-27', ''), '19.1.6'),
    /dated heading/,
  );
});

test('requires status, category and changes inside the current entry', () => {
  for (const missing of ['状态：本地构建。', '### 修复', '- 修复任务描述保存问题。']) {
    assert.throws(
      () =>
        validateChangelog(
          complete.replace(missing, '') +
            '\n## 其他\n' +
            complete.slice(complete.indexOf('状态：')),
          '19.1.6',
        ),
      /Complete/,
    );
  }
});

test('rejects unfinished placeholders in the release being packaged', () => {
  for (const placeholder of ['TODO', 'TBD', '待填写']) {
    assert.throws(
      () =>
        validateChangelog(
          complete.replace('修复任务描述保存问题。', placeholder),
          '19.1.6',
        ),
      /placeholders/,
    );
  }
});

test('CLI succeeds for documented versions and stops a new undocumented version', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dailymirror-changelog-'));
  try {
    fs.mkdirSync(path.join(root, 'tools'));
    const script = path.join(root, 'tools/check-dailymirror-changelog.js');
    fs.copyFileSync(path.join(__dirname, 'check-dailymirror-changelog.js'), script);
    fs.writeFileSync(
      path.join(root, 'CHANGELOG.zh-CN.md'),
      complete.replace(/\n/g, '\r\n'),
    );
    for (const version of ['19.1.6', '19.1.7']) {
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version }));
      const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
      assert.equal(result.status, version === '19.1.6' ? 0 : 1, result.stderr);
      if (version === '19.1.7') assert.match(result.stderr, /19\.1\.7/);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
