-- 将 admin 用户密码设为 admin123（bcrypt 哈希由 auth-service 生成）
UPDATE users
SET password_hash = '$2b$12$XYBK6jkzNhVkmd6jXsaYBeReiOET4ZzSMe2FuF9ehoAi24ZJGY8Vm'
WHERE username = 'admin';
