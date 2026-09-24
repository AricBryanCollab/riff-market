# RiffMarket verification map

This directory is the maintained source for verifying RiffMarket's user-facing behavior. Read this index before driving the app, then use the matching feature file as the recipe. All commands assume `V=.cursor/skills/verify-riff-market/scripts/riff-verify` and a run started with `$V up`.

## Baseline preconditions

- `$V up` finished and `RIFF_VERIFY_RUN` is exported.
- `$V doctor` prints `doctor: safe to drive`, and the listing counts include `APPROVED|14 PENDING|2`.
- The seeded accounts exist (password `riffmarket-seed`): `customer@verify.riffmarket.dev` (Customer), `admin@verify.riffmarket.dev` (Admin), and the sellers `vintage.boxes@seed.riffmarket.dev`, `tone.hunter@seed.riffmarket.dev`, `keys.king@seed.riffmarket.dev`.
- The seeded catalog has 14 approved listings across 3 sellers, 8 of them per shop page. There are two pending listings, `Verify Pending Jazzmaster` and `Verify Pending Wah Pedal`, both owned by Vintage Boxes.
- Never drive an app, database, or browser that this run's `up` did not start.

## Driving conventions

- Start each recipe with `$V browser reset` unless its preconditions say otherwise. Reset clears cookies and `localStorage`, which signs you out and empties the cart.
- Sign in through the navbar `Login` dialog. The sign-in recipe is in [auth.md](./auth.md).
- Prefer `--role`/`--name`, scoped with `--in-role dialog|banner|main|complementary|region`. Use `--exact` when one name is a prefix of another.
- Several navbar controls have no accessible name. For example, the cart, orders, and pending-listings buttons are named only by their count badge. Each feature file states the handle that works.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Mutations stay inside the run's private database. `down` throws it away, so no manual restore is needed.

## Proof and skip reporting

- Capture the user action and the resulting state. Save a `snapshot --path <feature>/<step>.aria.txt` before and after the change and keep `actions.log`. A final screenshot alone is not enough.
- UI proof is an ARIA snapshot plus a `screenshot` with the RiffMarket navbar visible.
- Mutation proof also needs a `$V sql` read of the stored row and a second user-facing view, for example the counterparty's `/notifications`.
- Record the feature ID and entry point with every artifact. Use the directory name plus a line in your report.
- If you cannot reach a path, report the attempted command and the unmet precondition. Do not report a skipped entry point as verified through a different path.
- Image upload goes to Cloudinary, which is not configured in verify runs. Report upload-dependent paths as blocked, not verified.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. Then come exactly four H2 sections, in this order.

1. `Sub-features` lists short IDs, one line per behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with riff-verify` starts with `Preconditions:` and uses labeled bullets. Each bullet pairs a user action with an exact command and its observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Sign up, sign in, and sign out](./auth.md) covers the navbar and inline dialogs, the role choice, failed sign-in, and the stored user row.
- [Browse and filter the shop](./shop-browse.md) covers search, category chips, sidebar filters, home category cards, pagination, and the empty state.
- [Listing detail](./listing-detail.md) covers the listing page, reviews, quantity bounds, and the guest add-to-cart prompt.
- [Cart and checkout](./cart-checkout.md) covers add to cart, the cart popover, `/cart`, placing an order, stock and order rows, and the seller's notification and orders.
- [Admin listing moderation](./admin-moderation.md) covers finding pending listings, accept and decline, the listing status, and the seller notification.
