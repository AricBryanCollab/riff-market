# Admin listing moderation

New listings start as pending and stay hidden from the public shop until an Admin accepts them. Admins find pending listings from the navbar and from the `Pending` chip on `/shop`, then open one and choose `Accept` or `Decline`. The seller is notified.

## Sub-features

- `mod-pending-popover` shows the navbar pending popover `Pending Approval` with the count and newest pending listings.
- `mod-pending-chip` swaps the `/shop` grid to pending listings with the `Pending` chip.
- `mod-accept` approves a pending listing. The listing becomes public, a toast confirms, and the seller is notified.
- `mod-decline` declines a pending listing so it never reaches the public shop.

## How to get to it (user POV)

- As an Admin, choose the navbar pending button (named by its count), then `View All Pending Listings`.
- As an Admin on `/shop`, choose the `Pending` chip, then a listing.
- Open `/listing/<pending id>` directly as an Admin.

## Driving it with riff-verify

Preconditions:

- `$V doctor` shows `PENDING|2`. The fixtures are `verify-pending-jazzmaster` (`Verify Pending Jazzmaster`) and `verify-pending-wah` (`Verify Pending Wah Pedal`).
- `$V browser reset` has run and you are signed in as `admin@verify.riffmarket.dev` ([auth.md](./auth.md)).

- **Popover.** Run `$V browser click --in-role banner --role button --name 2 --exact`. The dialog shows `Pending Approval`, `2 listings awaiting approval`, and both fixture names. Press `$V browser press --key Escape`.
- **Pending chip.** Run `$V browser goto /shop` and `$V browser click --in-role main --role button --name Pending --exact`. The grid shows only the two `Verify Pending ...` cards.
- **Open listing.** Run `$V browser click --role link --name "Verify Pending Jazzmaster" --nth 1`. The URL is `/listing/verify-pending-jazzmaster`, and the page shows enabled `Accept` and `Decline` buttons plus `Edit listing` and `Delete listing`.
- **Accept.** Run `$V browser click --role button --name Accept --exact`. The app returns to `/shop` with the toast `Listing approved successfully`. `$V sql 'select "listingStatus", "isApproved" from "Listing" where id = $$verify-pending-jazzmaster$$'` returns `APPROVED t`.
- **Public view.** Run `$V browser reset` and `$V browser goto "/shop?search=jazzmaster"`. A Guest now sees `Verify Pending Jazzmaster`.
- **Seller notified.** `$V sql 'select message from "Notification" where "userId" = $$seed-seller-vintage-boxes$$'` includes `Great News! Your listing Verify Pending Jazzmaster has been approved and live at the RiffMarket shop`. Signing in as `vintage.boxes@seed.riffmarket.dev` and opening `/notifications` shows the same text.
- **Decline.** As the Admin, open `/listing/verify-pending-wah` and run `$V browser click --role button --name Decline --exact`. Then `$V sql 'select "listingStatus" from "Listing" where id = $$verify-pending-wah$$'` should no longer be `PENDING`. Record the toast text and the resulting status. A Guest search for `wah` must stay empty.
- **Proof.** Save snapshots of the popover, the pending grid, and the listing before and after with `$V browser snapshot --path admin-moderation/<step>.aria.txt`. Also save the status and notification rows.

## Gotchas

- The pending fixtures are inserted by `seed-verify-fixtures.ts` because creating a listing through `Add Listing` → `/listing/new` uploads photos to Cloudinary, which verify runs do not configure. Report `Add Listing` itself as blocked unless real `CLOUDINARY_*` credentials were exported before `up`.
- Clicking a row in the `Pending Approval` popover does not navigate. Use `View All Pending Listings` or the `Pending` chip.
- `View All Pending Listings` goes to `/shop` but does not select the `Pending` chip. Choose the chip yourself.
- `Pending` is a substring of the fixture names, so always pass `--exact` for the chip, `Accept`, and `Decline`.
- The navbar pending button's name is the pending count. It changes from `2` to `1` after one moderation.
