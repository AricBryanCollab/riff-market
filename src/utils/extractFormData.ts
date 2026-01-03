export function extractFormData<
	T extends Record<string, FormDataEntryValue | null>,
>(formData: FormData, fields: string[]): T {
	return fields.reduce(
		(acc, field) => {
			acc[field] = formData.get(field);
			return acc;
		},
		{} as Record<string, FormDataEntryValue | null>,
	) as T;
}
