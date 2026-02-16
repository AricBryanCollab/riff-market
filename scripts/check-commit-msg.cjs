#!/usr/bin/env node

const fs = require('node:fs');

const ALLOWED_TYPES = [
  'init',
  'feat',
  'component',
  'hooks',
  'api',
  'style',
  'layout',
  'structure',
  'chore',
  'docs',
  'fix',
  'ref',
];

const usage = () => {
  console.error('Usage: node scripts/check-commit-msg.cjs <commit-msg-file>');
  console.error('   or: node scripts/check-commit-msg.cjs --message "type: lowercase title"');
};

const getSubject = () => {
  const [firstArg, secondArg] = process.argv.slice(2);

  if (!firstArg) {
    usage();
    process.exit(1);
  }

  if (firstArg === '--message') {
    if (!secondArg) {
      usage();
      process.exit(1);
    }
    return secondArg.trim();
  }

  try {
    const contents = fs.readFileSync(firstArg, 'utf8');
    return contents.split(/\r?\n/, 1)[0].trim();
  } catch (error) {
    console.error(`[commit] failed to read commit message file: ${error.message}`);
    process.exit(1);
  }
};

const subject = getSubject();

if (!subject) {
  console.error('[commit] empty commit title is not allowed.');
  process.exit(1);
}

if (subject.startsWith('Merge ') || subject.startsWith('Revert "')) {
  process.exit(0);
}

const commitPattern = new RegExp(`^(${ALLOWED_TYPES.join('|')}): .+$`);
if (!commitPattern.test(subject)) {
  console.error('[commit] invalid commit title format.');
  console.error(`[commit] expected: <type>: <lowercase action title>`);
  console.error(`[commit] allowed types: ${ALLOWED_TYPES.join(', ')}`);
  console.error(`[commit] received: ${subject}`);
  process.exit(1);
}

if (subject !== subject.toLowerCase()) {
  console.error('[commit] commit title must be lowercase.');
  console.error(`[commit] received: ${subject}`);
  process.exit(1);
}

if (!/^[\x20-\x7E]+$/.test(subject)) {
  console.error('[commit] commit title must use plain ASCII characters only (no emoji/unicode).');
  console.error(`[commit] received: ${subject}`);
  process.exit(1);
}
