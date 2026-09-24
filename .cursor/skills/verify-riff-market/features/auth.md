# Sign up, sign in, and sign out

A Guest can register as a Customer or Seller, sign in with email and password, see a clear error for bad credentials, and sign out. The navbar switches between `Login`/`Get Started` and the signed-in menu.

## Sub-features

- `auth-signup` registers a new account from the `Register at RiffMarket` dialog and signs it in.
- `auth-signup-role` chooses `Seller` or `Customer` in `I want to...` (Customer when left empty).
- `auth-signin` signs in an existing account from the `RiffMarket LogIn` dialog.
- `auth-signin-fail` shows `*Failed to sign in` for a wrong password and stays signed out.
- `auth-switch` moves between the two dialogs with their inline `Sign Up` / `Sign In` buttons.
- `auth-signout` signs out with the navbar `Logout` button.

## How to get to it (user POV)

- Choose `Login` in the navbar to open the `RiffMarket LogIn` dialog.
- Choose `Get Started` in the navbar to open the `Register at RiffMarket` dialog.
- Choose `Register Now` in the `/shop` header while signed out.
- Choose `Add to Cart` on a listing page while signed out. This opens the register dialog.
- Choose `Sign Up` inside the login dialog, or `Sign In` inside the register dialog.

## Driving it with riff-verify

Preconditions:

- `$V doctor` passes and `$V browser reset` has run.
- No user exists with the email you are about to register. Use a fresh `verify-$(date +%s)@example.com`.

- **Open register.** Choose `Get Started`. Run `$V browser click --role button --name "Get Started"`. The dialog `Register at RiffMarket` appears with textboxes `First Name`, `Last Name`, `Email`, `Password`, `Confirm Password` and the combobox `I want to...`.
- **Fill the form.** Run `$V browser fill --in-role dialog --label "First Name" --value Vera`, then the same for `Last Name`. Run `$V browser fill --in-role dialog --label Email --value "$EMAIL"`, `$V browser fill --in-role dialog --label Password --exact --value "Password123!"`, and `$V browser fill --in-role dialog --label "Confirm Password" --value "Password123!"`.
- **Pick a role (optional).** Run `$V browser click --in-role dialog --role combobox` and then `$V browser click --role option --name Seller`. Leaving it unset registers a Customer.
- **Submit.** Choose `Sign Up`. Run `$V browser click --in-role dialog --role button --name "Sign Up"` and `$V browser wait --role button --name Logout`. The navbar shows `Logged in as: Vera V.` and a `You are logged in` toast.
- **Stored user.** Run `$V sql "select email, role from \"User\" where email = '$EMAIL'"`. It returns one row with the chosen role (`CUSTOMER` by default). The password column is a bcrypt hash, not the plain text.
- **Sign out.** Choose `Logout`. Run `$V browser click --role button --name Logout` and `$V browser wait --role button --name Login`. `Login` and `Get Started` are back.
- **Sign in.** Run `$V browser click --role button --name Login`, `$V browser fill --in-role dialog --label Email --value "$EMAIL"`, `$V browser fill --in-role dialog --label Password --exact --value "Password123!"`, `$V browser click --in-role dialog --role button --name "Sign In"`, and `$V browser wait --role button --name Logout`.
- **Failed sign-in.** After `$V browser reset`, open `Login` and submit `customer@verify.riffmarket.dev` with password `wrong-password`. Run `$V browser wait --in-role dialog --text "Failed to sign in"`. The dialog stays open. Run `$V browser press --key Escape` and `$V browser wait --role button --name Login` to confirm you are still signed out.
- **Proof.** Run `$V browser snapshot --path auth/signed-in.aria.txt --role banner` and `$V browser screenshot --path auth/signed-in.png` while signed in, plus the `sql` row above.

## Gotchas

- Both dialogs have a `Password` field. The register dialog also has `Confirm Password`, so pass `--exact` with `--label Password`.
- Both dialogs have `Sign In` and `Sign Up` buttons: one submits, the other switches dialogs. Always scope with `--in-role dialog` and check which dialog is open, using `snapshot --role dialog`.
- The avatar button is named by the first initial (`C`, `T`, `A`), and clicking it goes to `/settings`. Do not use it as the "signed in" check. Wait for `Logout` instead.
- While a dialog is open, the rest of the page is hidden from the accessibility tree. `--in-role banner` lookups return nothing until you press `Escape`.
- The user menu renders client-side only. Right after `goto`, the navbar shows skeletons, so `wait` for `Login` or `Logout` before you assert.
- Test-helper users from `src/test/prisma-test-data.ts` have unhashed passwords and cannot sign in. Use the seeded verify accounts.
