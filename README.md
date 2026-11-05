# PawCare — Final Account & Cart Fix

## What was fixed
- Real sign-in on every animal/shop page using the same PHP session as `index.html`.
- Signed-in header now shows the account person icon with `Hello, FirstName` and an account menu.
- User session survives navigation between tabs because authentication is stored in the PHP session.
- Guest cart is merged into the signed-in user's database cart without duplicate product rows.
- Cart items added while signed in are stored under that user's `user_id` and reloaded from MySQL after refresh/login.
- Cart API now returns `image_url` for cart thumbnails.
- Product-page Checkout no longer triggers the Home galaxy entrance. It moves to the Home cart using a skip flag.
- Inner-page Cart also opens the Home cart without the Home galaxy entrance.
- The Home galaxy entrance remains only for a fresh/reloaded Home page.
- Top navigation tabs remain the only actions that use the 2-second page loading GUI.
- Add to Cart, product details, sign-in, cart, and checkout do not start a page transition.

## Database setup
1. Start Apache and MySQL in XAMPP.
2. Create a MySQL database named `pawcare`.
3. Import `schema.sql`.
4. Open the project through `http://localhost/...`, not by double-clicking the HTML file.
5. Check `config.php` if your MySQL username/password differs from the default XAMPP setup.


## Appointment booking
- Services now have a real appointment form on `services.html`.
- Booking data is stored in MySQL in the `appointments` table and references the `services` table.
- Import `database/migration_appointments.sql` once into the existing `pawcare` database before testing.
- Logged-in users are linked through `user_id`; guests can also submit their contact and pet information.
- Each branch/date/time slot is protected against duplicate active bookings.


## New owner / order / feedback features

Import `database/migration_owner_orders_feedback.sql` into the existing `pawcare` database after the normal schema.

Demo owner login:
- Email: `owner@pawcare.ph`
- Password: `owner123`

The owner account is stored separately in the `owners` table. Customer accounts remain in `users`.

Added:
- Customer **My Orders** page with order tracking: placed, processing/packed, shipped/on the way, delivered, or cancelled.
- Separate **Owner Dashboard** with Orders, Product Feedback, and Overview tabs.
- Owner can update an order status.
- Product detail/maximize window now has a customer comment box.
- Owner can read customer product feedback and send a reply.
- Owner login has a distinct dark/gold owner interface and `OWNER ACCOUNT` indicator.

For production, change the demo owner password or create a proper owner account before deployment.

## Account / Owner mode
- `account.php` is the shared My Account page for both customers and owners.
- Customers see their profile and order tracking (Placed → Packed/Processing → On the way → Delivered).
- Customers can change their nickname and profile photo; their login username/name and email remain unchanged.
- Owners use the same PawCare site and account page, but get OWNER MODE, all customer orders, status controls, customer feedback/replies, and overview.
- Run `database/migration_owner_orders_feedback.sql` against the existing `pawcare` database. The same migration now also adds the profile fields, so there is no separate profile migration.
