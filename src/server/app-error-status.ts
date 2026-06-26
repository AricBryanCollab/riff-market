import type { AppErrorKind } from "@/domains/shared/domain/result";

const appErrorStatusByKind = {
	validation: 400,
	authorization: 403,
	"not-found": 404,
	conflict: 409,
	invariant: 500,
	unexpected: 500,
} as const satisfies Record<AppErrorKind, number>;

export function toAppErrorStatus(kind: AppErrorKind) {
	return appErrorStatusByKind[kind];
}

export function isAppErrorKind(
	kind: string | null | undefined,
): kind is AppErrorKind {
	return (
		typeof kind === "string" &&
		Object.hasOwn(appErrorStatusByKind, kind)
	);
}
