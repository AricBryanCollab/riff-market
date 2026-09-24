# Browse and filter the shop

The `/shop` page lists approved listings, 8 per page. Users narrow it with a search box, category chips, and sidebar filters for category, price range, condition, and brand. Every filter is reflected in the URL query and survives a reload.

## Sub-features

- `shop-search` filters by text through `Search listings` and writes `?search=`.
- `shop-category-chip` filters with the `All` / `Electric Guitar` / `Acoustic Guitar` / `Keyboard/Piano` / `Pedals & Effects` / `Accessories` chips and writes `?category=`.
- `shop-sidebar` applies category, price range, condition, and brand filters from the collapsible `Filters` sidebar.
- `shop-clear` resets filters with `Clear All Filters`.
- `shop-paginate` pages with `Previous` / `Next` and shows `Page N of M`.
- `shop-empty` shows `No listings match your search here` when nothing matches.
- `shop-home-category` opens a filtered shop from the home page's `Browse by Category` cards.

## How to get to it (user POV)

- Choose `Shop` in the navbar, or `View all →` under `Recent Listings` on the home page.
- Choose a `Browse by Category` card on `/`, for example `Electric Guitars 4 listings`. This lands on `/shop?category=ELECTRIC`.
- Open a bookmarked filtered URL, for example `/shop?search=fender&category=ELECTRIC`.

## Driving it with riff-verify

Preconditions:

- `$V doctor` passes. The catalog is the seeded 14 approved listings, either signed out or as any role.

- **Open shop.** Run `$V browser goto /` and then `$V browser click --in-role banner --role link --name Shop`. The heading `Browse Music Tools` appears with 8 `View Details` links, and the text reads `Page 1 of 2`.
- **Search.** Run `$V browser fill --role textbox --name "Search listings" --value fender`, then `$V browser wait --role link --name "Fender Custom Shop Telecaster" --nth 0`. `$V browser url` ends in `?search=fender`, and `$V browser count --role link --name "View Details"` prints `2`.
- **Category chip.** Choose `Pedals & Effects`. Run `$V browser click --in-role main --role button --name "Pedals & Effects"`. The URL gains `category=PEDALS`, and with `search=fender` still set, the empty state `No listings match your search here` appears. Choose `All` to drop the category.
- **Sidebar filters.** Run `$V browser click --role button --name "Expand sidebar"`. The complementary region shows `Filters` with `Category`, `Price Range`, `Condition`, and `Brand`. Type a brand into `$V browser fill --in-role complementary --role textbox --name "Search brands..." --value Boss`. The footer reads `N filter(s) active`.
- **Clear.** Run `$V browser click --in-role complementary --role button --name "Clear All Filters"`. The URL returns to `/shop` and page 1 lists 8 cards again.
- **Paginate.** Run `$V browser click --in-role main --role button --name Next`. The text reads `Page 2 of 2`, it lists 6 cards, and `Next` is disabled.
- **Home category card.** Run `$V browser goto /` and `$V browser click --role link --name "Pedals & Effects 3 listings"`. The URL is `/shop?category=PEDALS` and it lists 3 cards.
- **Proof.** Run `$V browser snapshot --path shop/<step>.aria.txt --role main` after each filter change and `$V browser screenshot --path shop/<step>.png`. For a count, cross-check with `$V sql "select count(*) from \"Listing\" where \"listingStatus\"='APPROVED' and name ilike '%fender%'"`.

## Gotchas

- Sidebar checkboxes and the two price spinbuttons have no accessible name. Target them by the adjacent text inside `--in-role complementary`, or use the category chips in `main`, which are named buttons.
- Search is debounced into the URL. Wait for a result link or the empty-state text, not a fixed sleep.
- Every listing card has two links with the listing name (image and title). Use `--nth 0` when you click or wait on one.
- For admins, the chip row adds `Pending`, which swaps the grid to pending listings (see [admin-moderation.md](./admin-moderation.md)). `Pending` is a prefix of the pending listing names, so pass `--exact`.
- `Register Now` (Guest), `My Orders` (Customer), and `Add Listing` (Seller/Admin) share the header slot. For Customers, `My Orders` currently does nothing when clicked.
