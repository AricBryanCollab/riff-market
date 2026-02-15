#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, 'docs', 'concepts.map');
const CONCEPT_ID_REGEX = /^[a-z0-9_]+$/;
const CONCEPT_DEF_REGEX = /<!--\s*concept:def\s+([a-z0-9_]+)\s*-->/g;

const readRegistry = () => {
  let raw;
  try {
    raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  } catch (error) {
    throw new Error(
      `[docs] cannot read registry at ${REGISTRY_PATH}: ${error.message}`
    );
  }

  const concepts = new Map();
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = i + 1;
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const parts = trimmed.split('|');
    if (parts.length < 2) {
      throw new Error(
        `[docs] invalid registry line ${lineNumber}: expected "id|path|note", got: ${lines[i]}`
      );
    }

    const id = (parts[0] || '').trim();
    const canonicalPath = (parts[1] || '').trim().replace(/^\.([/\\])/, '');

    if (!id || !CONCEPT_ID_REGEX.test(id)) {
      throw new Error(
        `[docs] invalid concept id on line ${lineNumber}: "${id}"`
      );
    }

    if (!canonicalPath || !canonicalPath.startsWith('docs/')) {
      throw new Error(
        `[docs] invalid canonical path for "${id}" on line ${lineNumber}: "${canonicalPath}" (must start with "docs/")`
      );
    }

    if (concepts.has(id)) {
      throw new Error(`[docs] duplicate concept id "${id}" in registry (line ${lineNumber})`);
    }

    concepts.set(id, {
      canonicalPath,
      lineNumber,
    });
  }

  return concepts;
};

const listDocsFiles = () => {
  const root = path.join(ROOT, 'docs');
  let entries = [];

  try {
    const walk = dir => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
          walk(full);
        } else if (item.isFile() && full.endsWith('.md')) {
          entries.push(path.relative(ROOT, full).replace(/\\/g, '/'));
        }
      }
    };
    walk(root);
  } catch (error) {
    throw new Error(`[docs] failed to read docs directory: ${error.message}`);
  }

  return entries;
};

const scanFiles = files => {
  const defLocations = new Map();

  for (const file of files) {
    const absolutePath = path.join(ROOT, file);
    let contents;
    try {
      contents = fs.readFileSync(absolutePath, 'utf8');
    } catch (error) {
      throw new Error(`[docs] cannot read ${file}: ${error.message}`);
    }

    let match = CONCEPT_DEF_REGEX.exec(contents);
    while (match !== null) {
      const id = match[1];
      const locations = defLocations.get(id) ?? [];
      locations.push(file);
      defLocations.set(id, locations);
      match = CONCEPT_DEF_REGEX.exec(contents);
    }

    CONCEPT_DEF_REGEX.lastIndex = 0;
  }

  return defLocations;
};

const unique = values => [...new Set(values)];

const main = () => {
  const concepts = readRegistry();
  const trackedDocs = listDocsFiles();
  const defs = scanFiles(trackedDocs);
  const errors = [];

  for (const [id, locations] of defs.entries()) {
    if (!concepts.has(id)) {
      errors.push(
        `[docs] unknown concept definition "${id}" found in: ${unique(locations).join(', ')}`
      );
    }
  }

  for (const [id, meta] of concepts.entries()) {
    if (!trackedDocs.includes(meta.canonicalPath)) {
      errors.push(`[docs] registry concept "${id}" canonical file missing: ${meta.canonicalPath}`);
      continue;
    }

    const locations = defs.get(id) ?? [];
    if (locations.length === 0) {
      errors.push(`[docs] missing concept definition "${id}" in canonical file: ${meta.canonicalPath}`);
      continue;
    }
    if (locations.length > 1) {
      errors.push(
        `[docs] multiple concept definitions "${id}" found in: ${unique(locations).join(', ')}`
      );
      continue;
    }
    if (locations[0] !== meta.canonicalPath) {
      errors.push(
        `[docs] concept "${id}" must be defined in ${meta.canonicalPath}, but was found in ${locations[0]}`
      );
    }
  }

  if (errors.length) {
    console.error('[docs] contradiction check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('[docs] contradiction check passed');
};

main();
