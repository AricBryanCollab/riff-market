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
export type ValidateErr = { ok: false; reason: string; suggestion?: string };
export type ValidateResult = ValidateOk | ValidateErr;

/** Only matches when the prefix is an allowed type (case-insensitive). */
const TYPED_PATTERN = new RegExp(
	`^(${ALLOWED_TYPES.join("|")})(:\\s*)(.*)$`,
	"i",
);

const HELP_LINES = [
	"expected either:",
	"  <type>: <lowercase action title>",
	"  <Title starting with a capital letter>",
	`allowed types: ${ALLOWED_TYPES.join(", ")}`,
];

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

function typedSuggestion(type: string, description: string): string {
	const body = description.trim().toLowerCase();
	return body ? `${type}: ${body}` : `${type}: `;
}

function formatError(reason: string, suggestion?: string): ValidateErr {
	return suggestion === undefined
		? { ok: false, reason }
		: { ok: false, reason, suggestion };
}

export function validate(subject: string): ValidateResult {
	if (!subject) {
		return formatError("empty commit title is not allowed.");
	}

	if (subject.startsWith("Merge ") || subject.startsWith('Revert "')) {
		return { ok: true };
	}

	if (!/^[\x20-\x7E]+$/.test(subject)) {
		return formatError(
			"commit title must use plain ASCII characters only (no emoji/unicode).",
		);
	}

	const typed = TYPED_PATTERN.exec(subject);
	if (typed) {
		const [, rawType, separator, description] = typed;
		const type = rawType.toLowerCase();

		if (separator !== ": ") {
			return formatError(
				'typed commit titles must use ": " after the type.',
				typedSuggestion(type, description),
			);
		}

		if (!description.trim()) {
			return formatError("typed commit titles need a non-empty description.");
		}

		if (subject !== subject.toLowerCase()) {
			return formatError(
				"typed commit titles must be lowercase.",
				typedSuggestion(type, description),
			);
		}

		return { ok: true };
	}

	if (/^[A-Z]/.test(subject)) {
		return { ok: true };
	}

	const capitalized = subject.replace(/^./, (ch) => ch.toUpperCase());
	return formatError(
		["invalid commit title format.", ...HELP_LINES].join("\n"),
		capitalized !== subject ? capitalized : undefined,
	);
}

function printFailure(subject: string, result: ValidateErr): void {
	for (const line of result.reason.split("\n")) {
		console.error(`[commit] ${line}`);
	}
	console.error(`[commit] received: ${subject}`);
	if (result.suggestion !== undefined) {
		console.error(`[commit] try:      ${result.suggestion}`);
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
