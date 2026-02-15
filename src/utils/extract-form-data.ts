type FormDataEntry = FormDataEntryValue | null;

export function extractFormData<T extends Record<string, FormDataEntry>>(
	formData: FormData,
	fields: string[],
): T {
	return fields.reduce(
		(acc, field) => {
			acc[field] = formData.get(field);
			return acc;
		},
		{} as Record<string, FormDataEntry>,
	) as T;
}

export function extractPartialFormData<T extends Record<string, FormDataEntry>>(
	formData: FormData,
	fields: string[],
): Partial<T> {
	return fields.reduce(
		(acc, field) => {
			const value = formData.get(field);
			if (value !== null && value !== "") {
				acc[field] = value;
			}
			return acc;
		},
		{} as Record<string, FormDataEntry>,
	) as Partial<T>;
}
