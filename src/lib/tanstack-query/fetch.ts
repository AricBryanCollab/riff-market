type ApiFetchOptions = RequestInit & {
	contentType?: "application/json" | "multipart/form-data";
};

export async function apiFetch<T>(
	input: RequestInfo,
	init?: ApiFetchOptions,
): Promise<T> {
	const { contentType = "application/json", ...restInit } = init || {};

	const headers: HeadersInit =
		contentType === "multipart/form-data"
			? {}
			: { "Content-Type": contentType };

	const res = await fetch(input, {
		credentials: "include",
		headers: {
			...headers,
			...(restInit.headers || {}),
		},
		...restInit,
	});

	if (!res.ok) {
		const error = await res.json().catch(() => null);
		throw new Error(error?.message ?? res.statusText);
	}

	return res.json() as Promise<T>;
}
