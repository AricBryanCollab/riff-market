# RiffMarket

RiffMarket is a marketplace for musical gear. This glossary names the account and access concepts used across the app.

## Language

**User**:
A person with a RiffMarket account and a role that controls which market actions they can perform.
_Avoid_: account, auth user

**Current User**:
The User whose identity is active for the current request.
_Avoid_: logged-in account, session user

**Guest**:
A visitor without a Current User. A Guest can use public marketplace surfaces but not account-specific actions.
_Avoid_: anonymous user, unauthenticated user

**Customer**:
A User who buys gear through carts, checkout, purchases, and customer order views.
_Avoid_: buyer

**Seller**:
A User who lists gear and manages seller-side order fulfillment.
_Avoid_: vendor

**Admin**:
A User who moderates listings and handles platform-level oversight.
_Avoid_: moderator

**Money**:
A currency amount represented by a non-negative minor amount and a currency code.
_Avoid_: cents-only amount

**Minor Amount**:
The integer amount in a currency's smallest supported unit for marketplace pricing and snapshots.
_Avoid_: cents, float price

**Listing Price**:
The Seller's asking price for a Listing, held in the Listing's currency.
_Avoid_: product price
