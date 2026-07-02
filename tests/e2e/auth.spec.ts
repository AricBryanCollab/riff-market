import { expect, test } from "@playwright/test";

test("signs up, signs out, and signs back in", async ({ page }) => {
	const email = `auth-smoke-${Date.now()}@example.com`;
	const password = "Password123!";

	await page.goto("/");

	await page.getByRole("button", { name: "Get Started" }).click();
	await expect(
		page.getByRole("heading", { name: "Register at RiffMarket" }),
	).toBeVisible();

	await page.getByLabel("First Name").fill("Smoke");
	await page.getByLabel("Last Name").fill("Customer");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill(password);
	await page.getByLabel("Confirm Password").fill(password);
	await page.getByRole("button", { name: "Sign Up" }).click();

	await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

	await page.getByRole("button", { name: "Logout" }).click();
	await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

	await page.getByRole("button", { name: "Login" }).click();
	await expect(
		page.getByRole("heading", { name: "RiffMarket LogIn" }),
	).toBeVisible();

	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill(password);
	await page.getByRole("button", { name: "Sign In" }).click();

	await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
});
