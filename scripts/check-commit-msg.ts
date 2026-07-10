#!/usr/bin/env bun

import { readFileSync } from "node:fs";

export const ALLOWED_TYPES = [
	"init",
	"feat",
	"component",
	"hooks",
	"api",
	"style",
	"layout",
	"structure",
	"chore",
	"docs",
	"fix",
	"ref",
] as const;

export type ValidateOk = { ok: true };
export type ValidateErr = { ok: false; reason: string; try?: string };
export type ValidateResult = ValidateOk | ValidateErr;

const TYPE_PATTERN = /^([A-Za-z]+)(:\s*)(.*)$/;

function usage(): void {
	console.error("Usage: bun scripts/check-commit-msg.ts <commit-msg-file>");
	console.error(
		'   or: bun scripts/check-commit-msg.ts --message "type: lowercase title"',
	);
	console.error(
		'   or: bun scripts/check-commit-msg.ts --message "Title starting with a capital"',
	);
}

function getSubject(argv: string[]): string {
	const [firstArg, secondArg] = argv;

	if (!firstArg) {
		usage();
		process.exit(1);
	}

	if (firstArg === "--message") {
		if (!secondArg) {
			usage();
			process.exit(1);
		}
		return secondArg.trim();
	}

	try {
		return readFileSync(firstArg, "utf8").split(/\r?\n/, 1)[0]?.trim() ?? "";
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`[commit] failed to read commit message file: ${message}`);
		process.exit(1);
	}
}

function editDistance(a: string, b: string): number {
	const rows = a.length + 1;
	const cols = b.length + 1;
	const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

	for (let i = 0; i < rows; i++) dp[i][0] = i;
	for (let j = 0; j < cols; j++) dp[0][j] = j;

	for (let i = 1; i < rows; i++) {
		for (let j = 1; j < cols; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + cost,
			);
		}
	}

	return dp[a.length][b.length];
}

function closestType(candidate: string): string | undefined {
	const lower = candidate.toLowerCase();
	let best: { type: string; score: number } | undefined;

	for (const type of ALLOWED_TYPES) {
		let score: number;
		if (lower.startsWith(type) || type.startsWith(lower)) {
			score = Math.abs(lower.length - type.length);
		} else {
			score = editDistance(lower, type);
			if (score > 2) continue;
		}

		if (!best || score < best.score) {
			best = { type, score };
		}
	}

	return best?.type;
}

function typedSuggestion(type: string, description: string): string {
	const body = description.trim().toLowerCase();
	return body ? `${type}: ${body}` : `${type}: `;
}

function formatHelp(): string {
	return [
		"expected either:",
		"  <type>: <lowercase action title>",
		"  <Title starting with a capital letter>",
		`allowed types: ${ALLOWED_TYPES.join(", ")}`,
	].join("\n[commit] ");
}

export function validate(subject: string): ValidateResult {
	if (!subject) {
		return { ok: false, reason: "empty commit title is not allowed." };
	}

	if (subject.startsWith("Merge ") || subject.startsWith('Revert "')) {
		return { ok: true };
	}

	if (!/^[\x20-\x7E]+$/.test(subject)) {
		return {
			ok: false,
			reason: "commit title must use plain ASCII characters only (no emoji/unicode).",
		};
	}

	const typed = TYPE_PATTERN.exec(subject);
	if (typed) {
		const [, rawType, separator, description] = typed;
		const type = rawType.toLowerCase();
		const allowed = (ALLOWED_TYPES as readonly string[]).includes(type);

		if (allowed) {
			if (separator !== ": ") {
				return {
					ok: false,
					reason: 'typed commit titles must use ": " after the type.',
					try: typedSuggestion(type, description),
				};
			}

			if (!description.trim()) {
				return {
					ok: false,
					reason: "typed commit titles need a non-empty description.",
				};
			}

			if (subject !== subject.toLowerCase()) {
				return {
					ok: false,
					reason: "typed commit titles must be lowercase.",
					try: typedSuggestion(type, description),
				};
			}

			return { ok: true };
		}

		const suggestion = closestType(rawType);
		if (suggestion) {
			return {
				ok: false,
				reason: `unknown type "${rawType}". Did you mean "${suggestion}"?`,
				try: typedSuggestion(suggestion, description),
			};
		}

		return {
			ok: false,
			reason: `unknown type "${rawType}".\n[commit] ${formatHelp()}`,
		};
	}

	if (/^[A-Z]/.test(subject)) {
		return { ok: true };
	}

	const capitalized = subject.replace(/^./, (ch) => ch.toUpperCase());
	return {
		ok: false,
		reason: `invalid commit title format.\n[commit] ${formatHelp()}`,
		try: capitalized !== subject ? capitalized : undefined,
	};
}

function printFailure(subject: string, result: ValidateErr): void {
	for (const line of result.reason.split("\n")) {
		console.error(`[commit] ${line}`);
	}
	console.error(`[commit] received: ${subject}`);
	if (result.try !== undefined) {
		console.error(`[commit] try:      ${result.try}`);
	}
}

function main(): void {
	const subject = getSubject(process.argv.slice(2));
	const result = validate(subject);

	if (!result.ok) {
		printFailure(subject, result);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}
