#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = process.cwd();
const getFeatureMapPath = (cwd = ROOT) =>
  path.join(cwd, 'docs', 'features', 'features.map');
const getSignalsDir = (cwd = ROOT) =>
  path.join(cwd, 'tmp', 'agent-notes', 'docs-signals');

const BEHAVIOR_FILE_PATTERNS = [
  /^src\//,
  /^prisma\//,
  /^generated\//,
  /^public\//,
  /^package\.json$/,
  /^prisma\.config\.ts$/,
  /^tsconfig\.json$/,
  /^vite\.config\.ts$/,
];

const NON_BEHAVIOR_PREFIXES = [
  'docs/',
  'tmp/',
  '.github/',
  '.githooks/',
  '.vscode/',
  'dist/',
  'node_modules/',
];

const TAG_RULES = [
  { tag: 'auth', pattern: /(auth|login|signup|session|account|user)/i },
  { tag: 'checkout', pattern: /(checkout|payment|order|invoice|purchase)/i },
  { tag: 'cart', pattern: /(cart|basket)/i },
  { tag: 'catalog', pattern: /(catalog|product|listing|search)/i },
  { tag: 'admin', pattern: /(admin|dashboard|moderation)/i },
  { tag: 'data', pattern: /(prisma|schema|migration|database|db)/i },
  { tag: 'api', pattern: /(api|server|route|endpoint)/i },
];

const splitLines = value =>
  (value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

const unique = values => Array.from(new Set(values));

const run = (command, { cwd = ROOT } = {}) => {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (_error) {
    return null;
  }
};

const parseFeatureMapContent = raw => {
  const lines = splitLines(raw);
  const entries = [];

  for (const line of lines) {
    if (line.startsWith('#')) {
      continue;
    }

    const [id, canonicalPath, tagsRaw = '', status = 'active', lastReviewed = ''] =
      line.split('|').map(part => part.trim());

    if (!id || !canonicalPath) {
      continue;
    }

    entries.push({
      id,
      canonicalPath,
      status,
      lastReviewed,
      tags: tagsRaw
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    });
  }

  return entries;
};

const parseFeatureMap = ({
  cwd = ROOT,
  featureMapPath = getFeatureMapPath(cwd),
  existsSync = fs.existsSync,
  readFileSync = fs.readFileSync,
} = {}) => {
  if (!existsSync(featureMapPath)) {
    return [];
  }

  const raw = readFileSync(featureMapPath, 'utf8');
  return parseFeatureMapContent(raw);
};

const getChangedFiles = ({
  exec = run,
  env = process.env,
  cwd = ROOT,
} = {}) => {
  const safeRun = command => splitLines(exec(command, { cwd }));
  const untracked = safeRun('git ls-files --others --exclude-standard');
  const staged = safeRun('git diff --cached --name-only --diff-filter=ACMR');

  if (staged.length > 0) {
    return {
      source: 'staged (+ untracked)',
      files: unique([...staged, ...untracked]),
    };
  }

  const baseRef = env.DOCS_REPORT_BASE || env.GITHUB_BASE_REF;
  if (baseRef) {
    const qualifiedRef = baseRef.startsWith('origin/')
      ? baseRef
      : `origin/${baseRef}`;
    const fromBase = safeRun(
      `git diff --name-only --diff-filter=ACMR ${qualifiedRef}...HEAD`
    );
    if (fromBase.length > 0 || untracked.length > 0) {
      return {
        source: `${qualifiedRef}...HEAD (+ untracked)`,
        files: unique([...fromBase, ...untracked]),
      };
    }
  }

  return {
    source: 'HEAD working tree (+ untracked)',
    files: unique([
      ...safeRun('git diff --name-only --diff-filter=ACMR HEAD'),
      ...untracked,
    ]),
  };
};

const isBehaviorFile = file => {
  if (NON_BEHAVIOR_PREFIXES.some(prefix => file.startsWith(prefix))) {
    return false;
  }

  return BEHAVIOR_FILE_PATTERNS.some(pattern => pattern.test(file));
};

const inferTagsForFile = file => {
  const tags = new Set();
  const normalized = file.toLowerCase();

  for (const rule of TAG_RULES) {
    if (rule.pattern.test(normalized)) {
      tags.add(rule.tag);
    }
  }

  const routeMatch = normalized.match(/^src\/routes\/([^/]+)/);
  if (routeMatch && routeMatch[1]) {
    tags.add(routeMatch[1].replace(/\.[a-z0-9]+$/i, ''));
  }

  if (normalized.startsWith('prisma/')) {
    tags.add('data');
  }

  if (tags.size === 0) {
    tags.add('app');
  }

  return Array.from(tags);
};

const inferTags = files => {
  const tags = new Set();

  for (const file of files) {
    for (const tag of inferTagsForFile(file)) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
};

const listSignalFiles = ({
  cwd = ROOT,
  signalsDir = getSignalsDir(cwd),
  existsSync = fs.existsSync,
  readdirSync = fs.readdirSync,
} = {}) => {
  if (!existsSync(signalsDir)) {
    return [];
  }

  return readdirSync(signalsDir, { withFileTypes: true })
    .filter(
      entry =>
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        entry.name.toLowerCase() !== 'template.md'
    )
    .map(entry => entry.name)
    .sort();
};

const analyzeCoverage = ({ files, capsules, signalFiles }) => {
  const changedFiles = files ?? [];
  const registeredCapsules = capsules ?? [];
  const signals = signalFiles ?? [];

  if (changedFiles.length === 0) {
    return {
      type: 'no_changes',
      behaviorFiles: [],
      inferredTags: [],
      matches: [],
      signalFiles: signals,
      capsuleCount: registeredCapsules.length,
    };
  }

  const behaviorFiles = changedFiles.filter(isBehaviorFile);
  if (behaviorFiles.length === 0) {
    return {
      type: 'no_behavior_changes',
      behaviorFiles,
      inferredTags: [],
      matches: [],
      signalFiles: signals,
      capsuleCount: registeredCapsules.length,
    };
  }

  const inferredTags = inferTags(behaviorFiles);
  const matches = registeredCapsules.filter(capsule => {
    const hasTagOverlap = capsule.tags.some(tag => inferredTags.includes(tag));
    const directEdit = changedFiles.includes(capsule.canonicalPath);
    return hasTagOverlap || directEdit;
  });

  return {
    type: 'behavior_changes',
    behaviorFiles,
    inferredTags,
    matches,
    signalFiles: signals,
    capsuleCount: registeredCapsules.length,
  };
};

const formatReportLines = ({ source, files, analysis }) => {
  const lines = [];
  lines.push(`change source: ${source}`);
  lines.push(`changed files: ${files.length}`);

  if (analysis.type === 'no_changes') {
    lines.push('no local changes detected; nothing to report.');
    return lines;
  }

  if (analysis.type === 'no_behavior_changes') {
    lines.push('no likely behavior-level changes detected.');
    return lines;
  }

  lines.push(`behavior-level files: ${analysis.behaviorFiles.length}`);
  lines.push(
    `inferred tags: ${analysis.inferredTags.length > 0 ? analysis.inferredTags.join(', ') : 'none'}`
  );
  lines.push(
    `registered capsules: ${analysis.capsuleCount}, matching capsules: ${analysis.matches.length}`
  );

  if (analysis.matches.length > 0) {
    lines.push(
      `matched capsule ids: ${analysis.matches.map(match => match.id).join(', ')}`
    );
  } else {
    lines.push(
      'warning: no matching feature capsule found. Optional next step: add/update a capsule under docs/features/.'
    );
  }

  if (analysis.signalFiles.length === 0) {
    lines.push(
      'optional: add a docs signal note in tmp/agent-notes/docs-signals/ for future automation context.'
    );
  } else {
    lines.push(`signal notes available: ${analysis.signalFiles.length}`);
  }

  lines.push('report complete (non-blocking).');
  return lines;
};

const runCoverageReport = ({
  logger = console.log,
  exec = run,
  env = process.env,
  cwd = ROOT,
  parseFeatureMapFn = parseFeatureMap,
  listSignalFilesFn = listSignalFiles,
} = {}) => {
  const { source, files } = getChangedFiles({ exec, env, cwd });
  const capsules = parseFeatureMapFn({ cwd });
  const signalFiles = listSignalFilesFn({ cwd });
  const analysis = analyzeCoverage({ files, capsules, signalFiles });
  const lines = formatReportLines({ source, files, analysis });

  for (const line of lines) {
    logger(`[docs:report] ${line}`);
  }

  return { source, files, capsules, signalFiles, analysis, lines };
};

const main = () => {
  try {
    runCoverageReport();
    process.exit(0);
  } catch (error) {
    console.log(`[docs:report] warning: report execution error: ${error.message}`);
    console.log('[docs:report] report remains non-blocking.');
    process.exit(0);
  }
};

module.exports = {
  BEHAVIOR_FILE_PATTERNS,
  NON_BEHAVIOR_PREFIXES,
  TAG_RULES,
  splitLines,
  unique,
  getFeatureMapPath,
  getSignalsDir,
  parseFeatureMapContent,
  parseFeatureMap,
  getChangedFiles,
  isBehaviorFile,
  inferTagsForFile,
  inferTags,
  listSignalFiles,
  analyzeCoverage,
  formatReportLines,
  runCoverageReport,
  main,
};

if (require.main === module) {
  main();
}
