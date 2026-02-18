# Logger Patterns
<!-- concept:def logger_patterns -->

This project uses shared logger helpers to keep server and client logs consistent.

## Files

- Server logger: `src/lib/logger.ts`
- Client logger: `src/lib/client-logger.ts`
- Request middleware: `src/middleware.ts` (`requestLoggerMiddleware`, `authMiddleware`)

## Server-side Logging

Use `logger` in server routes, data, actions, and utilities.

- Prefer `logger.info` for normal events and `logger.error` for failures.
- Keep API responses unchanged; only replace `console.*` with structured logs.
- Add request context middleware to API routes that should include method/path/duration metadata.

### Route pattern

```ts
import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware, authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/example")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: {
			GET: async ({ request }) => {
				try {
					// ... business logic
					return new Response(JSON.stringify({ ok: true }), { status: 200 });
				} catch (error) {
					logger.error("Failed to serve example", error, {
						path: new URL(request.url).pathname,
					});

					return new Response(
						JSON.stringify({ error: "Example request failed" }),
						{ status: 500 },
					);
				}
			},
		},
	},
});
```

Use `middleware: [authMiddleware]` on specific handlers when session context is required.

## Client-side Logging

Use `clientLogger` in hooks, stores, and browser-only modules.

- Keep `clientLogger` for all non-server logs in client code.
- Avoid `console.*` in hooks/components and route logic that runs in the browser.

### Hook/store pattern

```ts
import { clientLogger } from "@/lib/client-logger";

const onError = (error: unknown) => {
	clientLogger.error("Failed to load data", error, {
		component: "useUserData",
		action: "retry",
	});
};
```

## Migration notes

- For route tests that mock middleware or actions, keep imports unchanged and mock implementations aligned.
- For server action/service tests, mocking with a shared object store is safer for runner compatibility.
- When adding a new API route handler, include `requestLoggerMiddleware` unless there is a specific reason not to collect request telemetry.
