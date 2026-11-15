-- MySQL 初始化脚本
-- 字符集已在 docker-compose.yml 中配置

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `online_school`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 授权
GRANT ALL PRIVILEGES ON `online_school`.* TO 'root'@'%';
FLUSH PRIVILEGES;
