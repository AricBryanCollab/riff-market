import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { chromium } from "playwright";

const HELP = `Usage: riff-verify browser <command> [flags]

Navigation
  goto <path>                 Open APP_URL + path and wait for the page to settle.
  url                         Print the current URL and document title.
  reset                       Clear cookies, localStorage, sessionStorage (signs out, empties cart), open /.

Actions (target flags below)
  click <target>              Click the element.
  fill <target> --value V     Replace the field's value.
  press --key K [<target>]    Press a key, focused on the target when given.
  hover <target>              Hover the element.

Assertions (exit 1 when unmet)
  wait <target> [--state visible|hidden|attached|detached] [--timeout ms]
  count <target>              Print how many elements match.
  text <target>               Print the element's visible text.

Evidence (relative paths land in EVIDENCE_DIR)
  snapshot [--path file] [<target>]   ARIA snapshot of the page or target; printed and saved.
  screenshot --path file [--full]     PNG of the viewport (or full page).

Target flags
  --role R --name N           getByRole (preferred). Add --exact for exact name match.
  --label L                   getByLabel (form fields).
  --text T                    getByText.
  --placeholder P             getByPlaceholder.
  --in-role R --in-name N     Scope the target inside a container (dialog, region, list...).
  --nth I                     Pick the I-th match (0-based) instead of requiring a unique match.

Every command is appended to EVIDENCE_DIR/actions.log.`;

const { APP_URL, CDP_PORT, EVIDENCE_DIR } = process.env;
if (!APP_URL || !CDP_PORT || !EVIDENCE_DIR) {
	console.error("browser: run through `riff-verify browser` with RIFF_VERIFY_RUN set");
	process.exit(2);
}

const [command, ...rest] = process.argv.slice(2);
const positional = [];
const flags = {};
for (let i = 0; i < rest.length; i++) {
	const arg = rest[i];
	if (arg.startsWith("--")) {
		const key = arg.slice(2);
		const next = rest[i + 1];
		if (next === undefined || next.startsWith("--")) {
			flags[key] = true;
		} else {
			flags[key] = next;
			i++;
		}
	} else {
		positional.push(arg);
	}
}

if (!command || command === "help") {
	console.log(HELP);
	process.exit(0);
}

const timeout = Number(flags.timeout ?? 10_000);

function evidencePath(path) {
	const full = isAbsolute(path) ? path : join(EVIDENCE_DIR, path);
	mkdirSync(dirname(full), { recursive: true });
	return full;
}

function record(status, detail = "") {
	mkdirSync(EVIDENCE_DIR, { recursive: true });
	const line = `${new Date().toISOString()}\t${status}\t${[command, ...rest].map((a) => JSON.stringify(a)).join(" ")}${detail ? `\t${detail}` : ""}\n`;
	appendFileSync(join(EVIDENCE_DIR, "actions.log"), line);
}

function hasTarget() {
	return ["role", "label", "text", "placeholder"].some((k) => k in flags);
}

function locate(page) {
	const exact = Boolean(flags.exact);
	let scope = page;
	if (flags["in-role"]) {
		scope = page.getByRole(flags["in-role"], flags["in-name"] ? { name: flags["in-name"] } : {});
	}
	let locator;
	if (flags.role) {
		locator = scope.getByRole(flags.role, flags.name ? { name: flags.name, exact } : {});
	} else if (flags.label) {
		locator = scope.getByLabel(flags.label, { exact });
	} else if (flags.text) {
		locator = scope.getByText(flags.text, { exact });
	} else if (flags.placeholder) {
		locator = scope.getByPlaceholder(flags.placeholder, { exact });
	} else {
		throw new Error("missing target: pass --role/--name, --label, --text, or --placeholder");
	}
	return flags.nth !== undefined ? locator.nth(Number(flags.nth)) : locator;
}

async function settle(page) {
	await page.waitForLoadState("load", { timeout: 30_000 });
	await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
}

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
try {
	const context = browser.contexts()[0] ?? (await browser.newContext());
	const page = context.pages().find((p) => !p.url().startsWith("devtools://")) ?? (await context.newPage());
	page.setDefaultTimeout(timeout);
	let output = "";

	switch (command) {
		case "goto": {
			const target = new URL(positional[0] ?? "/", APP_URL).toString();
			const response = await page.goto(target, { waitUntil: "load", timeout: 60_000 });
			await settle(page);
			output = `${response?.status() ?? "?"} ${page.url()} "${await page.title()}"`;
			break;
		}
		case "url":
			output = `${page.url()} "${await page.title()}"`;
			break;
		case "reset": {
			await context.clearCookies();
			await page.goto(new URL("/", APP_URL).toString(), { waitUntil: "load" });
			await page.evaluate(() => {
				localStorage.clear();
				sessionStorage.clear();
			});
			await page.reload({ waitUntil: "load" });
			await settle(page);
			output = `reset ${page.url()}`;
			break;
		}
		case "click":
			await locate(page).click();
			await settle(page);
			output = `clicked -> ${page.url()}`;
			break;
		case "hover":
			await locate(page).hover();
			output = "hovered";
			break;
		case "fill":
			if (flags.value === undefined) throw new Error("fill needs --value");
			await locate(page).fill(String(flags.value === true ? "" : flags.value));
			output = "filled";
			break;
		case "press":
			if (!flags.key) throw new Error("press needs --key");
			if (hasTarget()) {
				await locate(page).press(flags.key);
			} else {
				await page.keyboard.press(flags.key);
			}
			await settle(page);
			output = `pressed ${flags.key}`;
			break;
		case "wait": {
			const state = flags.state ?? "visible";
			await locate(page).first().waitFor({ state, timeout });
			output = `${state}`;
			break;
		}
		case "count":
			output = String(await locate(page).count());
			break;
		case "text":
			output = (await locate(page).innerText()).trim();
			break;
		case "snapshot": {
			const target = hasTarget() ? locate(page) : page.locator("body");
			const aria = await target.ariaSnapshot();
			output = `# ${page.url()}\n${aria}`;
			if (flags.path) {
				writeFileSync(evidencePath(flags.path), `${output}\n`);
			}
			break;
		}
		case "screenshot": {
			if (!flags.path) throw new Error("screenshot needs --path");
			const path = evidencePath(flags.path);
			await page.screenshot({ path, fullPage: Boolean(flags.full) });
			output = path;
			break;
		}
		default:
			throw new Error(`unknown command ${command}; see \`riff-verify browser help\``);
	}

	record("ok", output.split("\n")[0]);
	console.log(output);
} catch (error) {
	const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
	record("FAIL", message);
	console.error(`browser: ${message}`);
	process.exitCode = 1;
} finally {
	await browser.close().catch(() => {});
}
