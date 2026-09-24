---
name: verify-riff-market
description: Launch and drive the RiffMarket web app (TanStack Start marketplace for music gear) in a real headless browser against a disposable Postgres, then capture proof. Use when you need to verify UI or end-to-end behavior in this repo, like sign-in, shop search and filters, listing detail, cart and checkout, or admin listing moderation, instead of trusting unit tests or reading code.
---

# Verify RiffMarket

RiffMarket is a browser app. Users touch the web UI: navbar, `/shop`, `/listing/<id>`, `/cart`, `/checkout`, `/notifications`, `/settings`. There is no CLI and no public API. The server functions behind the UI are internal, so drive the UI.

Everything goes through one helper, `.cursor/skills/verify-riff-market/scripts/riff-verify`. Run it from the repo root. The examples below assume this alias:

```bash
V=.cursor/skills/verify-riff-market/scripts/riff-verify
```

Each run owns a private Postgres cluster, an app server, and a headless Chromium, each on a free port. Runs never share state. The helper never touches `.env`, your `DATABASE_URL`, or a dev server you already have running on port 3000.

Requirements: `bun`, `curl`, PostgreSQL server binaries (`initdb`/`pg_ctl`, found on `PATH`, via `pg_config`, or under `/usr/lib/postgresql/*/bin`), `psql`, and Playwright Chromium (`bunx playwright install chromium`, plus `sudo bunx playwright install-deps chromium` on a fresh Linux box). If there are no Postgres binaries, set `RIFF_VERIFY_DATABASE_URL` to a database you are allowed to wipe. Its name must contain `test`, `testing`, `vitest`, or `integration`.

## Launch

```bash
$V up            # production build + vite preview; about 15s on a warm checkout
$V up --dev      # vite dev server with HMR, for iterating on UI code
export RIFF_VERIFY_RUN=<id printed by up>
```

`up` does the following, in order:

1. Installs dependencies if `node_modules` is missing.
2. Runs `initdb` for a private cluster in `$TMPDIR/riff-verify/<run>/pg`.
3. Generates the Prisma client if it is missing.
4. Runs `prisma migrate deploy`.
5. Seeds the database with `prisma/seed.ts` (3 sellers, 14 approved listings, reviews) and `scripts/seed-verify-fixtures.ts` (one customer, one admin, two pending listings).
6. Builds and starts the app with placeholder Cloudinary credentials and a fixed `SESSION_SECRET`.
7. Starts Chromium with a CDP port.

It is ready when it prints `riff-verify: ready`, then `export RIFF_VERIFY_RUN=...`, `APP_URL=...`, and `EVIDENCE_DIR=...`. Every later command needs `RIFF_VERIFY_RUN` set. `up` always creates a new run and ignores an already-exported `RIFF_VERIFY_RUN`, so export the new id before you continue. Pass `--run <id>` to choose the id yourself. If `up` fails partway, it prints the log directory and the exact `down` command to clean up.

Seeded accounts all use the password `riffmarket-seed`:

| Role | Email |
| --- | --- |
| Customer | `customer@verify.riffmarket.dev` |
| Admin | `admin@verify.riffmarket.dev` |
| Seller | `vintage.boxes@seed.riffmarket.dev`, `tone.hunter@seed.riffmarket.dev`, `keys.king@seed.riffmarket.dev` |

Preview mode serves the build from `up` time. After you edit code, run `down` then `up` again, or use `--dev`. `doctor` fails when `HEAD` has moved past a preview build.

## Doctor

```bash
$V doctor
```

This check is read-only. It confirms that the app process is alive, that the app port belongs to this run's process tree, and that `GET /` serves `<title>RiffMarket</title>`. It also confirms that Postgres answers with migrations applied, that Chromium's CDP port answers, and that the checkout `HEAD` matches the build. It prints listing and user counts. Exit 0 with `doctor: safe to drive` means go. Run it first, and again whenever a step behaves strangely. Never drive a run that `doctor` rejects, and never point the helper at an app you did not start with `up`.

## Drive

`$V browser <command>` connects to this run's Chromium over CDP, acts on the one open tab, and disconnects. Page state, cookies, and the cart in `localStorage` persist between calls, so you can chain commands. Run `$V browser help` for the full list.

```bash
$V browser goto /shop
$V browser click --role button --name "Login"
$V browser fill --in-role dialog --label Email --value customer@verify.riffmarket.dev
$V browser fill --in-role dialog --label Password --exact --value riffmarket-seed
$V browser click --in-role dialog --role button --name "Sign In"
$V browser wait --role button --name Logout
$V browser snapshot --role main           # ARIA tree: read this before choosing selectors
$V browser reset                          # clear cookies + storage (sign out, empty cart)
```

- Target elements with `--role`/`--name` first, then `--label`, then `--text`. Use `--css` only for controls with no accessible name. Scope with `--in-role dialog` (or `--in-role banner`, `--in-role complementary`). Add `--exact` when one name is a prefix of another, for example `Password` and `Confirm Password`, or `Pending` and `Verify Pending ...`. Use `--nth` only when duplicates are inherent, for example each listing card has two links with the same name.
- Lookups are strict. Several matches make a command fail rather than click the wrong element.
- `wait`, `count`, and `text` are the assertions. `wait` exits 1 on timeout (default 10s, set with `--timeout`).
- Check database side effects with `$V sql "<query>"`. It runs `psql -tA` against the run's database. Prisma tables and columns are quoted camelCase, for example `"Listing"."listingStatus"`, `"Purchase"."totalAmountCents"`, and `"Notification"."message"`.
- For custom multi-step logic, a Playwright script can call `chromium.connectOverCDP("http://127.0.0.1:$CDP_PORT")`. Get the port from `$V env`. Prefer the CLI, because it writes the action log.

The feature recipes live in [`features/README.md`](features/README.md). Read the matching feature file before you drive.

## Evidence

Artifacts go to `tmp/riff-verify/<run>/` in the repo. `tmp/` is gitignored. This directory survives `down`.

- `actions.log` is written automatically. Every browser command is logged with a timestamp, `ok` or `FAIL`, its arguments, and its result.
- `$V browser snapshot --path <feature>/<step>.aria.txt [target]` saves an ARIA snapshot. It is also printed.
- `$V browser screenshot --path <feature>/<step>.png [--full]` saves a screenshot.
- Save side-effect rows with `$V sql "..." | tee tmp/riff-verify/$RIFF_VERIFY_RUN/<feature>/<name>.tsv`.

Proof standards:

- Go through the real user path: navbar, dialogs, buttons. Do not write fixture rows to fake the step under test. Direct URLs are fine only for reaching a page a user could also bookmark.
- Capture the action and the resulting state: a snapshot before and after the change, plus the action log. A final screenshot alone is not proof.
- Check side effects next to the UI, for example `Purchase`/`SellerOrder` rows, `Listing.stock`, `listingStatus`, or `Notification` rows for the counterparty. Then confirm them from a second user-facing view, such as the seller's `/notifications` page.
- Mocks are allowed only where a production boundary already isolates the external system. Cloudinary is the only one: credentials are placeholders, so any flow that uploads images (creating a listing, adding photos in edit) fails at upload. Report those flows as blocked unless real `CLOUDINARY_*` values are exported before `up`. Do not fake the upload.
- Record which feature ID and entry point each artifact proves. If you could not reach an entry point, report it as unverified. Do not count a different route as proof.

## Cleanup

```bash
$V down
```

`down` stops the Chromium and app process groups this run started (by recorded PID, never by name), stops the private Postgres with `pg_ctl`, and deletes `$TMPDIR/riff-verify/<run>/`. It keeps `tmp/riff-verify/<run>/` and prints its path. Run `down` after every attempt, including failed ones. `$V list` shows runs that still have scratch state. With `RIFF_VERIFY_DATABASE_URL`, `down` does not drop the external database.

## Helpers

All helpers live in `.cursor/skills/verify-riff-market/scripts/`.

- `riff-verify` is the executable entry point: `up`, `doctor`, `env`, `sql`, `browser`, `down`, `list`. Run `riff-verify help` for usage.
- `browser.mjs` is the CDP-connected Playwright driver behind `riff-verify browser`. Run it only through `riff-verify`, which supplies `APP_URL`, `CDP_PORT`, and `EVIDENCE_DIR`.
- `seed-verify-fixtures.ts` holds the verify-only accounts and pending listings. `up` runs it automatically.
