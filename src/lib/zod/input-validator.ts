import z from "zod";

export const zodInputValidator =
	<TSchema extends z.ZodType>(schema: TSchema) =>
	(data: unknown): z.output<TSchema> => {
		const parsed = schema.safeParse(data);

		if (!parsed.success) {
			throw new Error(z.prettifyError(parsed.error));
		}

		return parsed.data;
	};
