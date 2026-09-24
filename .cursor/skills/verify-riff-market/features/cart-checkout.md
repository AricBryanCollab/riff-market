# Cart and checkout

A Customer adds listings to a cart that persists in the browser, reviews it in the navbar popover and on `/cart`, and places an order on `/checkout` with a delivery address. The order creates a purchase, one seller order per seller, and a notification for each seller, and it lowers listing stock.

## Sub-features

- `cart-add` adds a listing with a chosen quantity from the listing page.
- `cart-popover` opens the navbar cart popover with items, quantities, and `Subtotal`.
- `cart-page` shows `Cart Summary` and per-item quantity and `Remove` on `/cart`.
- `checkout-place` places the order from `/checkout` with a `Delivery Address`.
- `checkout-effects` records the purchase and seller order rows, lowers stock, and sends a seller notification.
- `checkout-seller-view` shows the order to the seller in `/notifications` and the `Sales Orders` popover.

## How to get to it (user POV)

- Choose `Add to Cart` on a listing page while signed in as a Customer.
- Choose the navbar cart button, then `View Full Cart`. This goes to `/cart`.
- Choose `Proceed To Checkout` on `/cart`. This goes to `/checkout`.
- The seller opens `/notifications`, or chooses the navbar orders button and then `View All Orders`.

## Driving it with riff-verify

Preconditions:

- `$V doctor` passes and `$V browser reset` has run.
- You are signed in as `customer@verify.riffmarket.dev` ([auth.md](./auth.md)).
- `seed-listing-bossDs1` has stock 3 and there are no rows in `"Purchase"`. Check with `$V sql 'select stock from "Listing" where id = $$seed-listing-bossDs1$$'` and `$V sql 'select count(*) from "Purchase"'`.

- **Add to cart.** Run `$V browser goto /listing/seed-listing-bossDs1`, `$V browser click --role button --name "Increase quantity"`, and `$V browser click --role button --name "Add to Cart"`. The navbar cart button is now named `2`.
- **Popover.** Run `$V browser click --in-role banner --role button --name 2 --exact`. The dialog shows heading `Shopping Cart`, `2 items`, `Boss DS-1 Distortion` with `Qty: 2`, and `Subtotal: NT$3,600`.
- **Cart page.** Run `$V browser click --in-role dialog --role link --name "View Full Cart"` and then `$V browser press --key Escape`. `/cart` shows `Cart Summary`, `Total Items` `2`, `Total Price` `NT$3,600`, and the buttons `Remove` and `Proceed To Checkout`.
- **Checkout.** Run `$V browser click --role button --name "Proceed To Checkout"`. `/checkout` shows `Order Checkout`, `Quantity: 2`, and `Total NT$3,600`. Run `$V browser fill --label "Delivery Address" --value "12 Riff Lane, Taipei 100"` and `$V browser click --role button --name "Place Order"`. The app returns to `/shop` and the navbar cart button has no count.
- **Side effects.** `$V sql 'select "purchaseNumber", status, "totalAmountCents", "shippingAddress" from "Purchase"'` returns one `RIFF-...` row with `OPEN` and `3600`. `$V sql 'select "sellerId", status, "subtotalCents" from "SellerOrder"'` returns `seed-seller-tone-hunter NEW 3600`. The listing stock query now returns `1`.
- **Seller view.** Run `$V browser reset`, then sign in as `tone.hunter@seed.riffmarket.dev` and run `$V browser goto /notifications`. It shows `1 unread notification` and `New seller order for purchase #RIFF-...: Boss DS-1 Distortion. Amount: NT$3,600`. The navbar orders button is named `1`. Opening it shows `Sales Orders` with the purchase number and `Customer: Casey Customer`.
- **Proof.** Save snapshots at each step with `$V browser snapshot --path cart-checkout/<step>.aria.txt` and take a screenshot of `/checkout` before `Place Order`. Save the rows with `$V sql '...' | tee tmp/riff-verify/$RIFF_VERIFY_RUN/cart-checkout/<table>.tsv`.

## Gotchas

- Navbar cart, orders, and notification buttons have no accessible name. When the badge count is non-zero, the button's name is that count (`2`, `1`). When it is zero, the button is unnamed. Scope with `--in-role banner` and pass `--exact`. Several buttons can share the name `1`, so read `snapshot --role banner` to decide which `--nth` applies. The order is avatar, role button (cart, orders, or pending), notifications, `Logout`.
- The cart popover stays open after `View Full Cart` navigates, and its dialog then collides with page lookups. Press `Escape` first.
- The cart lives in `localStorage` and does not survive `reset`. Adding the same listing again adds to its quantity, capped at stock.
- The customer's `My Orders` button on `/shop` does nothing, and Customers have no orders popover. Prove the order through the rows and the seller's views instead.
- Checkout snapshot fields such as `totalAmountCents` and `subtotalCents` hold minor amounts. NT$3,600 is stored as `3600`.
