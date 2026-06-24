import { describe, expect, it } from "vitest";
import { NotificationRequestError } from "@/server/notification-service";
import {
	notificationJsonResponse,
	toNotificationErrorResponse,
} from "./notification-route-errors";

describe("notificationJsonResponse", () => {
	it("returns JSON content", async () => {
		const response = notificationJsonResponse({ ok: true }, 201);

		await expect(response.json()).resolves.toEqual({ ok: true });
		expect(response.status).toBe(201);
		expect(response.headers.get("content-type")).toMatch(
			/^application\/json\b/,
		);
	});
});

describe("toNotificationErrorResponse", () => {
	it("maps notification request errors to their public status and message", async () => {
		const response = toNotificationErrorResponse(
			new NotificationRequestError("Notification not found", { status: 404 }),
			"Failed to read the notification",
		);

		await expect(response.json()).resolves.toEqual({
			message: "Notification not found",
		});
		expect(response.status).toBe(404);
	});

	it("does not expose unexpected error details", async () => {
		const response = toNotificationErrorResponse(
			new Error("database password leaked in stack"),
			"Failed to get notifications",
		);

		await expect(response.json()).resolves.toEqual({
			message: "Failed to get notifications",
		});
		expect(response.status).toBe(500);
	});
});
