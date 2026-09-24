# Listing detail

The listing page at `/listing/<id>` shows one listing: photo, brand and model, title, rating summary, category, stock, price per unit, description, seller contact, and the `Customer Reviews` region. The actions depend on the viewer: Customers get quantity and `Add to Cart`, the owning Seller gets `Edit`/`Delete`, and Admins get `Accept`/`Decline` plus icon edit and delete.

## Sub-features

- `detail-view` renders the listing fields, price, stock, and seller for an approved listing.
- `detail-reviews` shows the rating summary link, the star breakdown, and review cards in `Customer Reviews`.
- `detail-quantity` bounds `Quantity` between 1 and stock with `Decrease quantity` / `Increase quantity`.
- `detail-guest-cart` opens the register dialog when a Guest chooses `Add to Cart`.
- `detail-role-actions` shows the viewer-specific action buttons.

## How to get to it (user POV)

- Choose a listing title, image, or `View Details` on `/shop` or in `Recent Listings` on `/`.
- Choose `View Listing` on the home carousel's featured listing.
- Open `/listing/<id>` directly. Seeded ids are `seed-listing-<key>`, for example `seed-listing-bossDs1` or `seed-listing-stratocaster`.

## Driving it with riff-verify

Preconditions:

- `$V doctor` passes and `$V browser reset` has run.
- `seed-listing-bossDs1` (Boss DS-1 Distortion, NT$1,800, stock 3, 1 review) is unchanged. Checkout in the same run lowers its stock.

- **Open from shop.** Run `$V browser goto /shop` and then `$V browser click --role link --name "Boss DS-1 Distortion" --nth 1`. The URL is `/listing/seed-listing-bossDs1`, and the level-1 heading `Boss DS-1 Distortion` shows with `Boss · DS-1`, `NT$1,800`, `3 in stock`, and `Sold by` `Tone Hunter`.
- **Reviews.** Run `$V browser snapshot --role region --name "Customer Reviews"`. It shows `1 review`, `4.0 out of 5`, and one card from `Keys K.` marked `Verified buyer`. The rating link `4.0 out of 5 stars 4.0 (1 review)` sits under the title.
- **Guest add to cart.** Run `$V browser click --role button --name "Add to Cart"`. The dialog `Register at RiffMarket` opens, and the cart stays empty.
- **Quantity bounds.** Sign in as the Customer ([auth.md](./auth.md)) and reopen the listing. `Decrease quantity` is disabled at `1`. Run `$V browser click --role button --name "Increase quantity"` twice. `$V browser snapshot` shows `spinbutton "Quantity": "3"` and `Increase quantity` is disabled at stock.
- **Role actions.** As the Customer you see `Add to Cart` and `Add to wishlist`. As `tone.hunter@seed.riffmarket.dev` (the owner) you see `Edit` and `Delete`, with no quantity controls. As the Admin on an approved listing, you see `Accept` (disabled), `Decline` (enabled: declining takes an approved listing down), `Edit listing`, and `Delete listing`.
- **Missing listing.** Run `$V browser goto /listing/does-not-exist`. The page shows `Listing not found` and a named `Back to Shop` button.
- **Proof.** Run `$V browser snapshot --path listing-detail/<step>.aria.txt` and `$V browser screenshot --path listing-detail/<step>.png` for each viewer.

## Gotchas

- The page has no `main` landmark. Use a full `snapshot`, or target `--role region --name "Customer Reviews"`.
- On a found listing, `Back to Shop` is a plain paragraph and clicking it does nothing. The unnamed arrow button to its left navigates. Use the navbar `Shop` link, or `--css "button:has(svg.lucide-arrow-left)"` if the arrow itself is under test.
- `Add to wishlist` has no behavior yet. Do not report favorites as verified.
- Listing photos are hot-linked from Wikimedia. Offline runs render broken images, which is not an app bug.
- Pending and declined listings are visible only to Admins. A Guest opening `/listing/verify-pending-jazzmaster` sees `Listing not found`.
