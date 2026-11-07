# PawCare — Final Account & Cart Fix

## What was fixed
- Real sign-in on every animal/shop page using the same PHP session as `index.html`.
- Signed-in header now shows the account person icon with `Hello, FirstName` and an account menu.
- User session survives navigation between tabs because authentication is stored in the PHP session.
- Guest cart is merged into the signed-in user's database cart without duplicate product rows.
- Cart items added while signed in are stored under that user's `user_id` and reloaded from Supabase PostgreSQL after refresh/login.
- Cart API now returns `image_url` for cart thumbnails.
- Product-page Checkout no longer triggers the Home galaxy entrance. It moves to the Home cart using a skip flag.
- Inner-page Cart opens a cart drawer in place; Checkout hands off to the existing Home checkout form.
- The Home galaxy entrance remains only for a fresh/reloaded Home page.
- Top navigation tabs remain the only actions that use the 2-second page loading GUI.
- Add to Cart, product details, sign-in, cart, and checkout do not start a page transition.

## Database setup
1. Start Apache in XAMPP; PHP must have the PostgreSQL PDO extension enabled (`pdo_pgsql`).
2. Copy `.env.example` to `.env` and set `SUPABASE_DB_PASSWORD` to the Supabase database password.
3. Apply `supabase/migrations/20261107090000_init_pawcare.sql` in the Supabase SQL Editor.
4. Apply `supabase/migrations/20261107150000_product_feedback_ratings.sql` to add five-star product ratings and allow rating-only feedback.
5. Apply `supabase/migrations/20261107200000_product_feedback_owner_sender.sql` to support owner-authored product feedback.
6. Apply `supabase/migrations/20261108090000_product_messages_inventory.sql` for customer/owner product messaging and preorder requests.
7. Open the project through `http://localhost/...`, not by double-clicking the HTML file.
8. For the alternate MySQL schema, import `schema.sql` (or `database/pawcare.sql`); apply `database/migration_product_messages_inventory.sql` to an existing MySQL schema.

## PHP hosting requirement
PawCare must run on a host that executes PHP and POST requests. A static-only host will return HTTP 405 because login, registration, cart, checkout, and owner APIs use PHP endpoints.

## Vercel deployment
1. Import the GitHub repository in Vercel.
2. Add these Vercel Environment Variables:
   - `SUPABASE_DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com`
   - `SUPABASE_DB_PORT=5432`
   - `SUPABASE_DB_NAME=postgres`
   - `SUPABASE_DB_USER=postgres.nbickxvumjpvqvmiiznj`
   - `SUPABASE_DB_PASSWORD=<database password>`
   - `SUPABASE_URL=https://nbickxvumjpvqvmiiznj.supabase.co`
3. Redeploy from the latest commit.
4. Verify `https://YOUR-VERCEL-DOMAIN/api/health.php` returns `"ok":true`.


## Appointment booking
- Services now have a real appointment form on `services.html`.
- Booking data is stored in Supabase PostgreSQL in the `appointments` table and references the `services` table.
- Apply the Supabase initialization migration before testing.
- Logged-in users are linked through `user_id`; guests can also submit their contact and pet information.
- Each branch/date/time slot is protected against duplicate active bookings.


## New owner / order / feedback features

Apply the Supabase initialization migration. It includes owner accounts, order tracking, feedback, profiles, and order messages.
Apply the later product-feedback migrations as well when setting up a new or existing database.

Demo owner login:
- Email: `owner@pawcare.ph`
- Password: `owner123`

The owner account is stored separately in the `owners` table. Customer accounts remain in `users`.

Added:
- Customer **My Orders** page with order tracking: placed, processing/packed, shipped/on the way, delivered, or cancelled.
- Separate **Owner Dashboard** with Orders, Product Feedback, and Overview tabs.
- Owner can update an order status.
- Product detail/maximize window supports a one-to-five-star rating with an optional comment.
- Owner and customers can exchange product messages in the account inbox; new messages show unread counts, and owners can use quick replies.
- Owner can see the monthly and all-time sales and rating overview, as well as a per-month rating summary.
- Owner can update product price and stock. Out-of-stock items cannot be added to cart; customers can submit preorder requests for owner review without payment or inventory being taken.
- Product details display the aggregate rating and customer reviews next to product information.
- Owner login has a distinct dark/gold owner interface and `OWNER ACCOUNT` indicator.

For production, change the demo owner password or create a proper owner account before deployment.

## Account / Owner mode
- `account.html` is the shared My Account page for both customers and owners.
- Customers see their profile and order tracking (Placed → Packed/Processing → On the way → Delivered).
- Customers can change their nickname and profile photo; their login username/name and email remain unchanged.
- Owners use the same PawCare site and account page, but get OWNER MODE, all customer orders, status controls, customer feedback, product messages, inventory controls, and overview.
- The Supabase initialization migration also adds the profile fields, so no separate profile migration is required.
