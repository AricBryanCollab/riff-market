const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseFeatureMapContent,
  analyzeCoverage,
  runCoverageReport,
} = require('./docs-coverage-report.cjs');

const TEMP_REPO_PREFIX = 'docs-report-test-';

const runCmd = (command, cwd) =>
  execSync(command, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const cleanupStaleFixtureRepos = () => {
  const tmpDir = os.tmpdir();
  const entries = fs.readdirSync(tmpDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(TEMP_REPO_PREFIX)) {
      continue;
    }

    const repoPath = path.join(tmpDir, entry.name);
    if (!fs.existsSync(path.join(repoPath, '.git'))) {
      continue;
    }

    fs.rmSync(repoPath, { recursive: true, force: true });
  }
};

cleanupStaleFixtureRepos();

const writeRepoFile = (repoPath, relativePath, contents) => {
  const absolutePath = path.join(repoPath, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents, 'utf8');
};

const appendRepoFile = (repoPath, relativePath, contents) => {
  const absolutePath = path.join(repoPath, relativePath);
  fs.appendFileSync(absolutePath, contents, 'utf8');
};

const createFixtureRepo = () => {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_REPO_PREFIX));

  runCmd('git init', repoPath);
  runCmd('git checkout -b main', repoPath);
  runCmd('git config user.email "docs-report-tests@example.com"', repoPath);
  runCmd('git config user.name "Docs Report Tests"', repoPath);

  writeRepoFile(
    repoPath,
    'docs/features/features.map',
    [
      '# feature_id|canonical_path|tags|status|last_reviewed',
      'auth_session_route_guards|docs/features/auth-session-route-guards.md|auth,session,rbac,routing,api|active|2026-02-17',
      '',
    ].join('\n')
  );
  writeRepoFile(
    repoPath,
    'docs/features/auth-session-route-guards.md',
    '# Auth Session and Route Guards\n'
  );
  writeRepoFile(repoPath, 'src/routes/auth/login.tsx', 'export const x = 1;\n');
  writeRepoFile(repoPath, 'docs/README.md', '# docs\n');

  runCmd('git add .', repoPath);
  runCmd('git commit -m "test fixture baseline"', repoPath);

  return repoPath;
};

test('parseFeatureMapContent parses valid registry lines', () => {
  const raw = `
# comment
auth_session_route_guards|docs/features/auth-session-route-guards.md|auth,session|active|2026-02-17
bad_line_without_path|
`;

  const entries = parseFeatureMapContent(raw);

  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], {
    id: 'auth_session_route_guards',
    canonicalPath: 'docs/features/auth-session-route-guards.md',
    status: 'active',
    lastReviewed: '2026-02-17',
    tags: ['auth', 'session'],
  });
});

test('analyzeCoverage classifies behavior and non-behavior changes', () => {
  const withBehavior = analyzeCoverage({
    files: ['src/routes/auth/login.tsx'],
    capsules: [
      {
        id: 'auth_session_route_guards',
        canonicalPath: 'docs/features/auth-session-route-guards.md',
        status: 'active',
        lastReviewed: '2026-02-17',
        tags: ['auth'],
      },
    ],
    signalFiles: [],
  });

  assert.equal(withBehavior.type, 'behavior_changes');
  assert.equal(withBehavior.matches.length, 1);

  const docsOnly = analyzeCoverage({
    files: ['docs/README.md'],
    capsules: [],
    signalFiles: [],
  });

  assert.equal(docsOnly.type, 'no_behavior_changes');
});

test('integration: staged auth route change matches real capsule mapping', t => {
  const repoPath = createFixtureRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));

  appendRepoFile(repoPath, 'src/routes/auth/login.tsx', 'export const y = 2;\n');
  writeRepoFile(
    repoPath,
    'tmp/agent-notes/docs-signals/auth-change.md',
    '# auth-change\n'
  );
  runCmd('git add src/routes/auth/login.tsx', repoPath);

  const result = runCoverageReport({
    cwd: repoPath,
    logger: () => {},
  });

  assert.equal(result.analysis.type, 'behavior_changes');
  assert.equal(result.analysis.matches.length, 1);
  assert.equal(result.analysis.matches[0].id, 'auth_session_route_guards');
  assert.equal(result.analysis.signalFiles.length, 1);
});

test('integration: staged docs-only change remains non-behavioral', t => {
  const repoPath = createFixtureRepo();
  t.after(() => fs.rmSync(repoPath, { recursive: true, force: true }));

  appendRepoFile(repoPath, 'docs/README.md', '\nextra docs note\n');
  runCmd('git add docs/README.md', repoPath);

  const result = runCoverageReport({
    cwd: repoPath,
    logger: () => {},
  });

  assert.equal(result.analysis.type, 'no_behavior_changes');
  assert.equal(result.analysis.behaviorFiles.length, 0);
});
