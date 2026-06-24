import { logger } from "@/lib/logger";
import { NotificationRequestError } from "@/server/notification-service";

export async function handleNotificationRoute(
	handler: () => Promise<Response>,
	fallbackMessage: string,
): Promise<Response> {
	try {
		return await handler();
	} catch (error) {
		return toNotificationErrorResponse(error, fallbackMessage);
	}
}

export function notificationJsonResponse(
	body: unknown,
	status = 200,
): Response {
	return Response.json(body, { status });
}

export function toNotificationErrorResponse(
	error: unknown,
	fallbackMessage: string,
): Response {
	if (error instanceof NotificationRequestError) {
		return notificationJsonResponse({ message: error.message }, error.status);
	}

	logger.error(fallbackMessage, error);
	return notificationJsonResponse({ message: fallbackMessage }, 500);
}
