export type AppErrorKind =
	| "validation"
	| "authorization"
	| "not-found"
	| "conflict"
	| "invariant"
	| "unexpected";

export interface AppError<TCode extends string = string> {
	readonly code: TCode;
	readonly message: string;
	readonly kind: AppErrorKind;
	readonly details?: unknown;
}

export interface Ok<T> {
	readonly ok: true;
	readonly value: T;
}

export interface Err<E extends AppError = AppError> {
	readonly ok: false;
	readonly error: E;
}

export type Result<T, E extends AppError = AppError> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
	return { ok: true, value };
}

export function err<E extends AppError>(error: E): Err<E> {
	return { ok: false, error };
}
