export async function apiFetch<T>(
	input: RequestInfo,
	init?: RequestInit,
): Promise<T> {
	const res = await fetch(input, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		...init,
	});

	if (!res.ok) {
		const error = await res.json().catch(() => null);
		throw new Error(error?.message ?? res.statusText);
	}

	return res.json() as Promise<T>;
}
