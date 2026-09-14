UPDATE "User" SET "passwordHash" = '$2b$10$8AhO0jcV5lysmvlECx4BJOqWQonQ9r9Z0tJTi.t8FmTGy7zmdeDJy' WHERE email = 'admin@test.com';
SELECT email, "passwordHash" FROM "User" WHERE email = 'admin@test.com';
