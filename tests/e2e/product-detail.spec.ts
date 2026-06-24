import { expect, test } from "@playwright/test";

test("opens an approved listing on the product page", async ({ page }) => {
	const response = await page.goto("/product/smoke-approved-listing");

	expect(response?.ok()).toBe(true);
	await expect(
		page.getByRole("heading", { name: "Smoke Telecaster" }),
	).toBeVisible();
});
