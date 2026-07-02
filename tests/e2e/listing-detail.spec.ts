import { expect, test } from "@playwright/test";

test("opens an approved listing on the listing page", async ({ page }) => {
	const response = await page.goto("/listing/smoke-approved-listing");

	expect(response?.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Smoke Telecaster" }),
	).toBeVisible();
});
