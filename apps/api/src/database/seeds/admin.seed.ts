import { DataSource } from 'typeorm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Admin } from '../../modules/admin/entities/admin.entity.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../.env.local') });

const DEFAULT_ADMIN = {
  username: 'admin',
  realName: '系统管理员',
};

// 初始管理员密码由环境变量提供，代码中不保留任何硬编码默认口令
const SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD || '';

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'online_school',
    entities: [Admin],
  });

  await dataSource.initialize();
  console.log('Database connected');

  const adminRepo = dataSource.getRepository(Admin);
  const existing = await adminRepo.findOne({ where: { username: DEFAULT_ADMIN.username } });

  if (existing) {
    console.log(`Admin "${DEFAULT_ADMIN.username}" already exists, skipping.`);
  } else if (!SEED_PASSWORD) {
    console.warn('未设置 ADMIN_SEED_PASSWORD，跳过初始管理员创建（在 .env.local 配置后重跑 seed:admin）');
  } else {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    await adminRepo.save({
      username: DEFAULT_ADMIN.username,
      password_hash: passwordHash,
      real_name: DEFAULT_ADMIN.realName,
      status: UserStatus.ACTIVE,
    });
    console.log(`Admin "${DEFAULT_ADMIN.username}" created successfully.`);
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
