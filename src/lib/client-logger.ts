type ClientLogContext = Record<string, unknown>;

const write = (method: "error" | "warn" | "info", ...args: unknown[]) => {
	if (typeof console === "undefined") {
		return;
	}

	console[method](...args);
};

export const clientLogger = {
	error: (message: string, error?: unknown, details?: ClientLogContext) => {
		write("error", message, error, ...(details ? [details] : []));
	},
	warn: (message: string, details?: ClientLogContext) => {
		write("warn", message, ...(details ? [details] : []));
	},
	info: (message: string, details?: ClientLogContext) => {
		write("info", message, ...(details ? [details] : []));
	},
};
