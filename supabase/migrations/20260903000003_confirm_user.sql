
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'test_signup_check@hangout.com';
