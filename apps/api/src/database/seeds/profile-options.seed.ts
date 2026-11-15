import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ProfileOption, ProfileOptionCategory } from '../../modules/profile-option/entities/profile-option.entity.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../.env.local') });

/**
 * 默认个人信息选项（与设计稿一致）
 */
const DEFAULT_OPTIONS: Array<{ category: ProfileOptionCategory; name: string; sort_order: number }> = [
  // 年级
  { category: ProfileOptionCategory.GRADE, name: '大一', sort_order: 10 },
  { category: ProfileOptionCategory.GRADE, name: '大二', sort_order: 20 },
  { category: ProfileOptionCategory.GRADE, name: '大三', sort_order: 30 },
  { category: ProfileOptionCategory.GRADE, name: '大四', sort_order: 40 },
  { category: ProfileOptionCategory.GRADE, name: '已毕业', sort_order: 50 },
  { category: ProfileOptionCategory.GRADE, name: '其他', sort_order: 60 },
  // 专业
  { category: ProfileOptionCategory.MAJOR, name: '英语', sort_order: 10 },
  { category: ProfileOptionCategory.MAJOR, name: '计算机科学与技术', sort_order: 20 },
  { category: ProfileOptionCategory.MAJOR, name: '工商管理', sort_order: 30 },
  // 所属院校
  { category: ProfileOptionCategory.UNIVERSITY, name: '北京师范大学', sort_order: 10 },
  { category: ProfileOptionCategory.UNIVERSITY, name: '浙江大学', sort_order: 20 },
  { category: ProfileOptionCategory.UNIVERSITY, name: '复旦大学', sort_order: 30 },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'online_school',
    entities: [ProfileOption],
    synchronize: true, // 开发期自动建表（生产由 API 启动时 synchronize/迁移负责）
  });

  await dataSource.initialize();
  console.log('Database connected');

  const optionRepo = dataSource.getRepository(ProfileOption);
  let created = 0;
  let skipped = 0;

  for (const item of DEFAULT_OPTIONS) {
    const existing = await optionRepo.findOne({
      where: { category: item.category, name: item.name },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await optionRepo.save(optionRepo.create({ ...item, is_enabled: true }));
    created++;
  }

  console.log(`Profile options seeded: ${created} created, ${skipped} skipped (already exist).`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
