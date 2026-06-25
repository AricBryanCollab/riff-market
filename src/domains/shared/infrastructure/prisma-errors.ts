import { Prisma } from "generated/prisma/client";

export function isPrismaUniqueConflict(
	error: unknown,
	fields: readonly string[],
) {
	if (
		!(error instanceof Prisma.PrismaClientKnownRequestError) ||
		error.code !== "P2002"
	) {
		return false;
	}

	return (
		hasFieldTarget(error.meta?.target, fields) ||
		hasDriverAdapterConstraintField(error.meta?.driverAdapterError, fields)
	);
}

function hasDriverAdapterConstraintField(
	value: unknown,
	fields: readonly string[],
) {
	if (!isRecord(value) || !isRecord(value.cause)) {
		return false;
	}

	const constraint = value.cause.constraint;

	return isRecord(constraint) && hasFieldTarget(constraint.fields, fields);
}

function hasFieldTarget(value: unknown, fields: readonly string[]) {
	if (Array.isArray(value)) {
		const normalizedTargets = value.map(normalizeConstraintField);

		return fields.some((field) => normalizedTargets.includes(field));
	}

	if (typeof value !== "string") {
		return false;
	}

	const normalizedTarget = normalizeConstraintField(value);

	return (
		fields.includes(normalizedTarget) ||
		fields.some((field) => normalizedTarget.includes(field))
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeConstraintField(value: unknown) {
	return typeof value === "string" ? value.replaceAll('"', "") : "";
}
