-- Replace 'YOUR_DISCORD_ID' with the actual Discord ID
UPDATE users
SET role = 'SUPER_ADMIN'
WHERE discord_id = 'YOUR_DISCORD_ID';

-- To check current users and their roles:
SELECT discord_id, username, role, tenant_id FROM users;