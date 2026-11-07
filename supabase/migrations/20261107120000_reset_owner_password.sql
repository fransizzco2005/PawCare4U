-- Reset the demo owner password to owner123.
-- The previous seed hash did not match the documented password.
UPDATE owners
SET password_hash = '$2b$12$VSIpE75dS9S9Btk15h1TruJZZ8iO6pXpr/VQhqYiJo30AW6B1bhvS'
WHERE email = 'owner@pawcare.ph';
