const fs = require('node:fs');
const path = require('node:path');

function validateChangelog(markdown, version) {
  const entries = markdown
    .split(/^## /m)
    .filter((entry) => entry.startsWith(`[${version}]`));
  if (entries.length !== 1) {
    throw new Error(`CHANGELOG.zh-CN.md must contain exactly one entry for ${version}.`);
  }
  const entry = entries[0];
  const heading = entry.split(/\r?\n/)[0];
  const prefix = `[${version}] - `;
  if (
    !heading.startsWith(prefix) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(heading.slice(prefix.length))
  ) {
    throw new Error(`Add a dated heading: ## [${version}] - YYYY-MM-DD`);
  }
  if (!/^状态：\S.*/m.test(entry) || !/^### .+/m.test(entry) || !/^- \S.*/m.test(entry)) {
    throw new Error(`Complete the status, category and change list for ${version}.`);
  }
  if (/\b(?:TODO|TBD)\b|待填写/i.test(entry)) {
    throw new Error(`Replace unfinished placeholders in the ${version} entry.`);
  }
}

if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    const { version } = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    validateChangelog(
      fs.readFileSync(path.join(root, 'CHANGELOG.zh-CN.md'), 'utf8'),
      version,
    );
    console.log(`DailyMirror ${version}: changelog check passed.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateChangelog };
