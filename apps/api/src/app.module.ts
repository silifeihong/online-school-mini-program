import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { StudentModule } from './modules/student/student.module.js';
import { ProfileOptionModule } from './modules/profile-option/profile-option.module.js';
import { CourseModule } from './modules/course/course.module.js';
import { MaterialModule } from './modules/material/material.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { UploadModule } from './modules/upload/upload.module.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        charset: 'utf8mb4',
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),

    // Feature modules
    AuthModule,
    UserModule,
    AdminModule,
    StudentModule,
    ProfileOptionModule,
    CourseModule,
    MaterialModule,
    SettingsModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
